import webpush from "web-push";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

function configured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT
  );
}

function ensureVapid() {
  if (!configured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  return true;
}

export function hashEndpoint(endpoint: string) {
  return createHash("sha256").update(endpoint).digest("hex");
}

export async function savePushSubscription(input: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
}) {
  const endpointHash = hashEndpoint(input.endpoint);
  return prisma.pushSubscription.upsert({
    where: { endpointHash },
    create: {
      userId: input.userId,
      endpoint: input.endpoint,
      endpointHash,
      p256dh: input.p256dh,
      auth: input.auth,
      userAgent: input.userAgent ?? null,
    },
    update: {
      userId: input.userId,
      p256dh: input.p256dh,
      auth: input.auth,
      userAgent: input.userAgent ?? null,
    },
  });
}

export async function removePushSubscription(endpoint: string) {
  const endpointHash = hashEndpoint(endpoint);
  await prisma.pushSubscription.deleteMany({ where: { endpointHash } });
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!ensureVapid()) return { sent: 0, skipped: true as const };

  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (!subs.length) return { sent: 0, skipped: false as const, prefs };

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      );
      sent += 1;
    } catch (error) {
      const statusCode =
        typeof error === "object" && error && "statusCode" in error
          ? Number((error as { statusCode?: number }).statusCode)
          : 0;
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
  }

  return { sent, skipped: false as const, prefs };
}

export async function notifyHouseholdPartners(input: {
  householdId: string;
  actorId: string;
  title: string;
  body: string;
  url?: string;
  /** When set, skip users who turned off that preference. */
  preferKey?: "assignments" | "deadlines" | "decisions" | "comments" | "contributions";
}) {
  const members = await prisma.householdMember.findMany({
    where: {
      householdId: input.householdId,
      status: "active",
      userId: { not: input.actorId },
    },
  });

  for (const member of members) {
    if (input.preferKey) {
      const prefs = await prisma.notificationPreference.findUnique({
        where: { userId: member.userId },
      });
      if (prefs && !prefs[input.preferKey]) continue;
    }
    await sendPushToUser(member.userId, {
      title: input.title,
      body: input.body,
      url: input.url,
    });
  }
}

export { configured as pushConfigured };
