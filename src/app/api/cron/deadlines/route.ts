import { NextResponse } from "next/server";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { typePath } from "@/lib/status";
import type { ItemType } from "@/types";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

function kindForDays(daysUntilDue: number): "3d" | "1d" | "overdue" | null {
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue === 1) return "1d";
  if (daysUntilDue === 3) return "3d";
  return null;
}

function messageFor(kind: "3d" | "1d" | "overdue", title: string) {
  if (kind === "3d") {
    return {
      title: "Coming up in 3 days",
      body: `"${title}" is due in 3 days.`,
    };
  }
  if (kind === "1d") {
    return {
      title: "Due tomorrow",
      body: `"${title}" is due tomorrow.`,
    };
  }
  return {
    title: "Overdue",
    body: `"${title}" is overdue.`,
  };
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = startOfDay(new Date());
  const openStatuses = [
    "not_started",
    "in_progress",
    "blocked",
    "collecting_options",
    "awaiting_response",
    "discussion",
    "on_track",
    "needs_attention",
    "behind",
  ];

  const items = await prisma.item.findMany({
    where: {
      dueDate: { not: null },
      archivedAt: null,
      status: { in: openStatuses },
      completedAt: null,
    },
    include: {
      household: {
        include: {
          members: {
            where: { status: "active" },
          },
        },
      },
    },
  });

  let sent = 0;

  for (const item of items) {
    if (!item.dueDate) continue;
    const days = differenceInCalendarDays(startOfDay(item.dueDate), today);
    const kind = kindForDays(days);
    if (!kind) continue;

    const already = await prisma.deadlineReminderLog.findUnique({
      where: { itemId_kind: { itemId: item.id, kind } },
    });
    if (already) continue;

    const copy = messageFor(kind, item.title);
    const url = `/${typePath(item.type as ItemType)}/${item.id}`;

    for (const member of item.household.members) {
      const prefs = await prisma.notificationPreference.findUnique({
        where: { userId: member.userId },
      });
      if (prefs && !prefs.deadlines) continue;

      const result = await sendPushToUser(member.userId, {
        title: copy.title,
        body: copy.body,
        url,
      });
      sent += result.sent;

      await prisma.notification.create({
        data: {
          userId: member.userId,
          householdId: item.householdId,
          itemId: item.id,
          type: "deadline",
          title: copy.title,
          body: copy.body,
        },
      });
    }

    await prisma.deadlineReminderLog.create({
      data: { itemId: item.id, kind },
    });
  }

  return NextResponse.json({ ok: true, checked: items.length, sent });
}
