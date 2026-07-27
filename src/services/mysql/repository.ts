import bcrypt from "bcryptjs";
import { dollarsToCents } from "@/lib/money";
import { utcNowIso } from "@/lib/dates";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { typePath } from "@/lib/status";
import { prisma } from "@/lib/prisma";
import type { CreateItemInput } from "@/lib/validations";
import type {
  ActivityEvent,
  Comment,
  CommentReaction,
  HouseholdContext,
  Item,
  ItemStatus,
  ItemType,
  ItemWithMeta,
  Notification,
  Profile,
} from "@/types";
import {
  clearDemoSessionUserId,
  readDemoSessionUserId,
  writeDemoSessionUserId,
} from "@/services/demo/session-cookie";

function mapProfile(row: {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}): Profile {
  return {
    id: row.id,
    email: row.email,
    full_name: row.fullName,
    avatar_url: row.avatarUrl,
    timezone: row.timezone,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

function mapItem(row: {
  id: string;
  householdId: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  createdBy: string;
  ownerId: string | null;
  priority: string;
  startDate: Date | null;
  dueDate: Date | null;
  completedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  outcome?: string | null;
  decidedOptionId?: string | null;
}): ItemWithMeta {
  return {
    id: row.id,
    household_id: row.householdId,
    type: row.type as ItemType,
    title: row.title,
    description: row.description,
    status: row.status as ItemStatus,
    created_by: row.createdBy,
    owner_id: row.ownerId,
    priority: row.priority as Item["priority"],
    start_date: row.startDate?.toISOString() ?? null,
    due_date: row.dueDate?.toISOString() ?? null,
    completed_at: row.completedAt?.toISOString() ?? null,
    archived_at: row.archivedAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    outcome: row.outcome ?? null,
    decided_option_id: row.decidedOptionId ?? null,
  };
}

async function requireUser(): Promise<Profile> {
  const userId = await readDemoSessionUserId();
  if (!userId) throw new Error("Not authenticated");
  const row = await prisma.profile.findUnique({ where: { id: userId } });
  if (!row) throw new Error("User not found");
  return mapProfile(row);
}

async function assertHouseholdAccess(householdId: string, userId: string) {
  const member = await prisma.householdMember.findFirst({
    where: { householdId, userId, status: "active" },
  });
  if (!member) throw new Error("Forbidden: cross-household access denied");
}

async function enrichItem(itemId: string): Promise<ItemWithMeta | null> {
  const row = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      checklist: { orderBy: { sortOrder: "asc" } },
      options: { orderBy: { sortOrder: "asc" } },
      responses: true,
      goalDetails: true,
      milestones: { orderBy: { sortOrder: "asc" } },
      financial: true,
      contributions: { orderBy: { contributedAt: "desc" } },
      _count: { select: { comments: true } },
    },
  });
  if (!row) return null;

  const base = mapItem(row);
  base.comment_count = row._count.comments;

  if (row.type === "task") {
    base.checklist = row.checklist.map((c) => ({
      id: c.id,
      item_id: c.itemId,
      title: c.title,
      completed: c.completed,
      sort_order: c.sortOrder,
      created_at: c.createdAt.toISOString(),
    }));
  }
  if (row.type === "decision") {
    base.options = row.options.map((o) => ({
      id: o.id,
      item_id: o.itemId,
      title: o.title,
      description: o.description,
      pros: (o.pros as string[]) ?? [],
      cons: (o.cons as string[]) ?? [],
      image_url: o.imageUrl,
      sort_order: o.sortOrder,
      created_at: o.createdAt.toISOString(),
    }));
    base.responses = row.responses.map((r) => ({
      id: r.id,
      item_id: r.itemId,
      option_id: r.optionId,
      user_id: r.userId,
      note: r.note,
      created_at: r.createdAt.toISOString(),
      updated_at: r.updatedAt.toISOString(),
    }));
  }
  if (row.type === "goal") {
    base.goal = row.goalDetails
      ? {
          item_id: row.goalDetails.itemId,
          tracking_type: row.goalDetails.trackingType as "numeric" | "percentage" | "milestone" | "habit",
          target_value: row.goalDetails.targetValue,
          current_value: row.goalDetails.currentValue,
          unit: row.goalDetails.unit,
          weekly_frequency: row.goalDetails.weeklyFrequency,
          streak_count: row.goalDetails.streakCount,
        }
      : null;
    base.milestones = row.milestones.map((m) => ({
      id: m.id,
      item_id: m.itemId,
      title: m.title,
      target_date: m.targetDate?.toISOString() ?? null,
      completed_at: m.completedAt?.toISOString() ?? null,
      sort_order: m.sortOrder,
      created_at: m.createdAt.toISOString(),
    }));
  }
  if (row.type === "financial_target") {
    base.financial = row.financial
      ? {
          item_id: row.financial.itemId,
          target_amount_cents: row.financial.targetAmountCents,
          current_amount_cents: row.financial.currentAmountCents,
        }
      : null;
    base.contributions = row.contributions.map((c) => ({
      id: c.id,
      item_id: c.itemId,
      amount_cents: c.amountCents,
      contributor_id: c.contributorId,
      contributed_at: c.contributedAt.toISOString(),
      note: c.note,
      created_at: c.createdAt.toISOString(),
    }));
  }

  return base;
}

async function pushActivity(
  householdId: string,
  itemId: string | null,
  actorId: string,
  eventType: string,
  summary: string,
  metadata: Record<string, unknown> | null = null
) {
  await prisma.activityEvent.create({
    data: {
      householdId,
      itemId,
      actorId,
      eventType,
      summary,
      metadata: metadata ? (metadata as object) : undefined,
    },
  });
}

export const mysqlRepository = {
  async reset() {
    // no-op for production DB
  },

  async signIn(email: string, password?: string) {
    const row = await prisma.profile.findUnique({ where: { email: email.toLowerCase() } });
    if (!row) throw new Error("No account found for that email");
    if (password) {
      const ok = await bcrypt.compare(password, row.passwordHash);
      if (!ok) throw new Error("Invalid password");
    }
    await writeDemoSessionUserId(row.id);
    return mapProfile(row);
  },

  async signInMagic(email: string) {
    const row = await prisma.profile.findUnique({ where: { email: email.toLowerCase() } });
    if (!row) throw new Error("No account found for that email");
    await writeDemoSessionUserId(row.id);
    return mapProfile(row);
  },

  async signOut() {
    await clearDemoSessionUserId();
  },

  async getSessionUser() {
    const userId = await readDemoSessionUserId();
    if (!userId) return null;
    const row = await prisma.profile.findUnique({ where: { id: userId } });
    return row ? mapProfile(row) : null;
  },

  async getHouseholdContext(): Promise<HouseholdContext | null> {
    const user = await this.getSessionUser();
    if (!user) return null;
    const membership = await prisma.householdMember.findFirst({
      where: { userId: user.id, status: "active" },
      include: {
        household: true,
      },
    });
    if (!membership) return null;

    const members = await prisma.householdMember.findMany({
      where: { householdId: membership.householdId, status: "active" },
      include: { user: true },
    });

    const mapped = members.map((m) => ({
      id: m.id,
      household_id: m.householdId,
      user_id: m.userId,
      role: m.role as "creator" | "partner",
      status: m.status as "active" | "invited" | "left",
      joined_at: m.joinedAt?.toISOString() ?? null,
      created_at: m.createdAt.toISOString(),
      profile: mapProfile(m.user),
    }));

    const partner = mapped.find((m) => m.user_id !== user.id)?.profile ?? null;

    return {
      household: {
        id: membership.household.id,
        name: membership.household.name,
        created_by: membership.household.createdBy,
        created_at: membership.household.createdAt.toISOString(),
        updated_at: membership.household.updatedAt.toISOString(),
      },
      members: mapped,
      currentUser: user,
      partner,
    };
  },

  async createHousehold(fullName: string, householdName: string, partnerEmail?: string) {
    let user = await this.getSessionUser();
    if (!user) {
      const passwordHash = await bcrypt.hash("together123", 10);
      const created = await prisma.profile.create({
        data: {
          email: `user-${Date.now()}@together.app`,
          passwordHash,
          fullName,
        },
      });
      user = mapProfile(created);
      await writeDemoSessionUserId(user.id);
    } else {
      await prisma.profile.update({
        where: { id: user.id },
        data: { fullName },
      });
      user = { ...user, full_name: fullName };
    }

    const household = await prisma.household.create({
      data: {
        name: householdName,
        createdBy: user.id,
        members: {
          create: {
            userId: user.id,
            role: "creator",
            status: "active",
            joinedAt: new Date(),
          },
        },
      },
    });

    let invitationToken: string | null = null;
    if (partnerEmail) {
      invitationToken = `inv-${Math.random().toString(36).slice(2, 10)}`;
      await prisma.householdInvitation.create({
        data: {
          householdId: household.id,
          email: partnerEmail,
          token: invitationToken,
          invitedBy: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return {
      household: {
        id: household.id,
        name: household.name,
        created_by: household.createdBy,
        created_at: household.createdAt.toISOString(),
        updated_at: household.updatedAt.toISOString(),
      },
      invitationToken,
    };
  },

  async getInvitation(token: string) {
    const row = await prisma.householdInvitation.findUnique({ where: { token } });
    if (!row) return null;
    return {
      id: row.id,
      household_id: row.householdId,
      email: row.email,
      token: row.token,
      invited_by: row.invitedBy,
      expires_at: row.expiresAt.toISOString(),
      accepted_at: row.acceptedAt?.toISOString() ?? null,
      created_at: row.createdAt.toISOString(),
    };
  },

  async acceptInvitation(token: string, fullName: string) {
    const invitation = await prisma.householdInvitation.findUnique({ where: { token } });
    if (!invitation) throw new Error("Invitation not found");
    if (invitation.acceptedAt) throw new Error("Invitation already used");
    if (invitation.expiresAt < new Date()) throw new Error("Invitation expired");

    const activeCount = await prisma.householdMember.count({
      where: { householdId: invitation.householdId, status: "active" },
    });
    if (activeCount >= 2) throw new Error("Household is full");

    let user = await this.getSessionUser();
    if (!user) {
      const passwordHash = await bcrypt.hash("together123", 10);
      const created = await prisma.profile.create({
        data: {
          email: invitation.email.toLowerCase(),
          passwordHash,
          fullName,
        },
      });
      user = mapProfile(created);
      await writeDemoSessionUserId(user.id);
    }

    await prisma.$transaction([
      prisma.householdInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
      prisma.householdMember.create({
        data: {
          householdId: invitation.householdId,
          userId: user.id,
          role: "partner",
          status: "active",
          joinedAt: new Date(),
        },
      }),
    ]);

    return user;
  },

  async listItems(type?: ItemType, opts?: { archived?: boolean; search?: string }) {
    const ctx = await this.getHouseholdContext();
    if (!ctx) return [];

    const rows = await prisma.item.findMany({
      where: {
        householdId: ctx.household.id,
        ...(type ? { type } : {}),
        archivedAt: opts?.archived ? { not: null } : null,
        ...(opts?.search
          ? {
              OR: [
                { title: { contains: opts.search } },
                { description: { contains: opts.search } },
              ],
            }
          : {}),
      },
      include: {
        goalDetails: true,
        financial: true,
        _count: { select: { comments: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return rows.map((row) => {
      const item = mapItem(row);
      item.comment_count = row._count.comments;
      if (row.goalDetails) {
        item.goal = {
          item_id: row.goalDetails.itemId,
          tracking_type: row.goalDetails.trackingType as "numeric" | "percentage" | "milestone" | "habit",
          target_value: row.goalDetails.targetValue,
          current_value: row.goalDetails.currentValue,
          unit: row.goalDetails.unit,
          weekly_frequency: row.goalDetails.weeklyFrequency,
          streak_count: row.goalDetails.streakCount,
        };
      }
      if (row.financial) {
        item.financial = {
          item_id: row.financial.itemId,
          target_amount_cents: row.financial.targetAmountCents,
          current_amount_cents: row.financial.currentAmountCents,
        };
      }
      return item;
    });
  },

  async getItem(itemId: string) {
    const user = await requireUser();
    const row = await prisma.item.findUnique({ where: { id: itemId } });
    if (!row) return null;
    await assertHouseholdAccess(row.householdId, user.id);
    return enrichItem(itemId);
  },

  async createItem(input: CreateItemInput) {
    const ctx = await this.getHouseholdContext();
    if (!ctx) throw new Error("No household");

    const ownerId =
      input.owner === "both"
        ? null
        : input.owner === "self"
          ? ctx.currentUser.id
          : ctx.partner?.id ?? null;

    let status: string =
      input.type === "task"
        ? "not_started"
        : input.type === "decision"
          ? "collecting_options"
          : "not_started";

    const created = await prisma.item.create({
      data: {
        householdId: ctx.household.id,
        type: input.type,
        title: input.title,
        description: input.description || null,
        status,
        createdBy: ctx.currentUser.id,
        ownerId,
        priority: input.priority ?? "normal",
        startDate: input.start_date ? new Date(input.start_date) : null,
        dueDate: input.due_date ? new Date(input.due_date) : null,
      },
    });

    if (input.type === "goal") {
      await prisma.goalDetails.create({
        data: {
          itemId: created.id,
          trackingType: input.tracking_type ?? "habit",
          targetValue: input.target_value ?? 12,
          currentValue: 0,
          unit: "weeks",
          weeklyFrequency: input.weekly_frequency ?? 1,
        },
      });
      await prisma.item.update({
        where: { id: created.id },
        data: { status: "on_track" },
      });
    }

    if (input.type === "financial_target") {
      const target = dollarsToCents(Number(input.target_amount ?? 0));
      const current = dollarsToCents(Number(input.current_amount ?? 0));
      await prisma.financialDetails.create({
        data: {
          itemId: created.id,
          targetAmountCents: target,
          currentAmountCents: current,
        },
      });
      await prisma.item.update({
        where: { id: created.id },
        data: {
          status: current >= target && target > 0 ? "reached" : current > 0 ? "on_track" : "not_started",
        },
      });
    }

    if (input.type === "decision" && input.options?.length) {
      await prisma.decisionOption.createMany({
        data: input.options.map((opt, index) => ({
          itemId: created.id,
          title: opt.title,
          pros: opt.pros ?? [],
          cons: opt.cons ?? [],
          sortOrder: index,
        })),
      });
      await prisma.item.update({
        where: { id: created.id },
        data: { status: "awaiting_response" },
      });
    }

    await pushActivity(
      ctx.household.id,
      created.id,
      ctx.currentUser.id,
      "created",
      `Created by ${ctx.currentUser.full_name}`
    );

    const itemUrl = `/${typePath(created.type as ItemType)}/${created.id}`;
    const typeLabel =
      created.type === "financial_target"
        ? "financial target"
        : created.type === "decision"
          ? "decision"
          : created.type === "goal"
            ? "goal"
            : "task";

    if (ownerId && ownerId !== ctx.currentUser.id) {
      await prisma.notification.create({
        data: {
          userId: ownerId,
          householdId: ctx.household.id,
          itemId: created.id,
          type: "assignment",
          title: "New assignment",
          body: `${ctx.currentUser.full_name} assigned ${created.title} to you.`,
        },
      });
    }

    // In-app + push: partner learns when something new is created
    const partners = ctx.members.filter((m) => m.user_id !== ctx.currentUser.id);
    for (const partner of partners) {
      if (ownerId === partner.user_id) continue; // already notified as assignment
      await prisma.notification.create({
        data: {
          userId: partner.user_id,
          householdId: ctx.household.id,
          itemId: created.id,
          type: "assignment",
          title: "Something new",
          body: `${ctx.currentUser.full_name} created a ${typeLabel}: "${created.title}".`,
        },
      });
    }

    try {
      const { notifyHouseholdPartners } = await import("@/lib/push");
      await notifyHouseholdPartners({
        householdId: ctx.household.id,
        actorId: ctx.currentUser.id,
        title: "Something new",
        body: `${ctx.currentUser.full_name} created a ${typeLabel}: "${created.title}".`,
        url: itemUrl,
        preferKey: "assignments",
      });
    } catch {
      // Push is optional — never block create on delivery failure.
    }

    return (await enrichItem(created.id))!;
  },

  async deleteItem(itemId: string) {
    const user = await requireUser();
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) throw new Error("Item not found");
    await assertHouseholdAccess(item.householdId, user.id);
    const type = item.type as ItemType;
    await prisma.item.delete({ where: { id: itemId } });
    await pushActivity(
      item.householdId,
      null,
      user.id,
      "deleted",
      `${user.full_name} deleted "${item.title}"`
    );
    return { id: itemId, type };
  },

  async updateItemStatus(itemId: string, status: Item["status"]) {
    const user = await requireUser();
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) throw new Error("Item not found");
    await assertHouseholdAccess(item.householdId, user.id);
    await prisma.item.update({
      where: { id: itemId },
      data: {
        status,
        completedAt:
          status === "completed" || status === "decided" || status === "reached"
            ? new Date()
            : null,
      },
    });
    await pushActivity(
      item.householdId,
      item.id,
      user.id,
      "status_changed",
      `Status changed to ${status.replaceAll("_", " ")}`
    );
    return (await enrichItem(itemId))!;
  },

  async toggleTaskComplete(itemId: string) {
    const item = await this.getItem(itemId);
    if (!item || item.type !== "task") throw new Error("Task not found");
    const next = item.status === "completed" ? "not_started" : "completed";
    return this.updateItemStatus(itemId, next as ItemStatus);
  },

  async recordDecisionResponse(itemId: string, optionId: string, note?: string) {
    const user = await requireUser();
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) throw new Error("Decision not found");
    await assertHouseholdAccess(item.householdId, user.id);

    await prisma.decisionResponse.upsert({
      where: { itemId_userId: { itemId, userId: user.id } },
      create: { itemId, optionId, userId: user.id, note: note ?? null },
      update: { optionId, note: note ?? null },
    });
    await prisma.item.update({
      where: { id: itemId },
      data: { status: "discussion" },
    });
    await pushActivity(
      item.householdId,
      itemId,
      user.id,
      "response_recorded",
      `${user.full_name} recorded a response`
    );
    return (await enrichItem(itemId))!;
  },

  async decideOutcome(itemId: string, optionId: string, summary: string) {
    const user = await requireUser();
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) throw new Error("Decision not found");
    await assertHouseholdAccess(item.householdId, user.id);
    await prisma.item.update({
      where: { id: itemId },
      data: {
        status: "decided",
        decidedOptionId: optionId,
        outcome: summary,
        completedAt: new Date(),
      },
    });
    await pushActivity(item.householdId, itemId, user.id, "decided", "Decision finalized");
    return (await enrichItem(itemId))!;
  },

  async addContribution(itemId: string, amountDollars: number, note?: string) {
    const user = await requireUser();
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { financial: true },
    });
    if (!item || item.type !== "financial_target" || !item.financial) {
      throw new Error("Target not found");
    }
    await assertHouseholdAccess(item.householdId, user.id);

    const amountCents = dollarsToCents(amountDollars);
    const current = item.financial.currentAmountCents + amountCents;
    await prisma.$transaction([
      prisma.financialContribution.create({
        data: {
          itemId,
          amountCents,
          contributorId: user.id,
          contributedAt: new Date(),
          note: note || null,
        },
      }),
      prisma.financialDetails.update({
        where: { itemId },
        data: { currentAmountCents: current },
      }),
      prisma.item.update({
        where: { id: itemId },
        data: {
          status: current >= item.financial.targetAmountCents ? "reached" : "on_track",
          completedAt: current >= item.financial.targetAmountCents ? new Date() : null,
        },
      }),
    ]);

    await pushActivity(
      item.householdId,
      itemId,
      user.id,
      "contribution_added",
      `${user.full_name} added a contribution`
    );

    const partner = await prisma.householdMember.findFirst({
      where: {
        householdId: item.householdId,
        status: "active",
        userId: { not: user.id },
      },
    });
    if (partner) {
      await prisma.notification.create({
        data: {
          userId: partner.userId,
          householdId: item.householdId,
          itemId,
          type: "contribution",
          title: "New contribution",
          body: `${user.full_name} added to ${item.title}.`,
        },
      });
    }

    return (await enrichItem(itemId))!;
  },

  async updateGoalProgress(itemId: string, currentValue: number) {
    const user = await requireUser();
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { goalDetails: true },
    });
    if (!item || !item.goalDetails) throw new Error("Goal not found");
    await assertHouseholdAccess(item.householdId, user.id);

    const completed =
      item.goalDetails.targetValue != null && currentValue >= item.goalDetails.targetValue;
    await prisma.$transaction([
      prisma.goalDetails.update({
        where: { itemId },
        data: { currentValue },
      }),
      prisma.item.update({
        where: { id: itemId },
        data: {
          status: completed ? "completed" : "on_track",
          completedAt: completed ? new Date() : null,
        },
      }),
    ]);
    await pushActivity(
      item.householdId,
      itemId,
      user.id,
      "progress_updated",
      `${user.full_name} updated progress`
    );
    return (await enrichItem(itemId))!;
  },

  async listComments(itemId: string) {
    const item = await this.getItem(itemId);
    if (!item) return [];
    const rows = await prisma.comment.findMany({
      where: { itemId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(
      (c): Comment => ({
        id: c.id,
        item_id: c.itemId,
        user_id: c.userId,
        parent_id: c.parentId,
        body: c.body,
        edited_at: c.editedAt?.toISOString() ?? null,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
      })
    );
  },

  async listReactions(itemId: string) {
    const comments = await this.listComments(itemId);
    const ids = comments.map((c) => c.id);
    if (!ids.length) return [];
    const rows = await prisma.commentReaction.findMany({
      where: { commentId: { in: ids } },
    });
    return rows.map(
      (r): CommentReaction => ({
        id: r.id,
        comment_id: r.commentId,
        user_id: r.userId,
        emoji: r.emoji,
        created_at: r.createdAt.toISOString(),
      })
    );
  },

  async addComment(itemId: string, body: string, parentId?: string | null) {
    const user = await requireUser();
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) throw new Error("Item not found");
    await assertHouseholdAccess(item.householdId, user.id);

    const comment = await prisma.comment.create({
      data: {
        itemId,
        userId: user.id,
        parentId: parentId ?? null,
        body,
      },
    });

    const partner = await prisma.householdMember.findFirst({
      where: {
        householdId: item.householdId,
        status: "active",
        userId: { not: user.id },
      },
    });
    if (partner) {
      const mentioned = /@partner/i.test(body);
      await prisma.notification.create({
        data: {
          userId: partner.userId,
          householdId: item.householdId,
          itemId,
          type: mentioned ? "mention" : "comment",
          title: mentioned ? "You were mentioned" : "New comment",
          body: `${user.full_name} commented on ${item.title}.`,
        },
      });
    }

    return {
      id: comment.id,
      item_id: comment.itemId,
      user_id: comment.userId,
      parent_id: comment.parentId,
      body: comment.body,
      edited_at: null,
      created_at: comment.createdAt.toISOString(),
      updated_at: comment.updatedAt.toISOString(),
    } satisfies Comment;
  },

  async addReaction(commentId: string, emoji: string) {
    const user = await requireUser();
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { item: true },
    });
    if (!comment) throw new Error("Comment not found");
    await assertHouseholdAccess(comment.item.householdId, user.id);

    const existing = await prisma.commentReaction.findUnique({
      where: {
        commentId_userId_emoji: { commentId, userId: user.id, emoji },
      },
    });
    if (existing) {
      return {
        id: existing.id,
        comment_id: existing.commentId,
        user_id: existing.userId,
        emoji: existing.emoji,
        created_at: existing.createdAt.toISOString(),
      } satisfies CommentReaction;
    }

    const reaction = await prisma.commentReaction.create({
      data: { commentId, userId: user.id, emoji },
    });
    return {
      id: reaction.id,
      comment_id: reaction.commentId,
      user_id: reaction.userId,
      emoji: reaction.emoji,
      created_at: reaction.createdAt.toISOString(),
    } satisfies CommentReaction;
  },

  async listActivity(itemId: string) {
    const item = await this.getItem(itemId);
    if (!item) return [];
    const rows = await prisma.activityEvent.findMany({
      where: { itemId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(
      (a): ActivityEvent => ({
        id: a.id,
        household_id: a.householdId,
        item_id: a.itemId,
        actor_id: a.actorId,
        event_type: a.eventType,
        summary: a.summary,
        metadata: (a.metadata as Record<string, unknown> | null) ?? null,
        created_at: a.createdAt.toISOString(),
      })
    );
  },

  async listNotifications() {
    const user = await requireUser();
    const rows = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(
      (n): Notification => ({
        id: n.id,
        user_id: n.userId,
        household_id: n.householdId,
        item_id: n.itemId,
        type: n.type,
        title: n.title,
        body: n.body,
        read_at: n.readAt?.toISOString() ?? null,
        created_at: n.createdAt.toISOString(),
      })
    );
  },

  async markNotificationRead(notificationId: string) {
    const user = await requireUser();
    const n = await prisma.notification.findFirst({
      where: { id: notificationId, userId: user.id },
    });
    if (!n) return null;
    const updated = await prisma.notification.update({
      where: { id: n.id },
      data: { readAt: new Date() },
    });
    return {
      id: updated.id,
      user_id: updated.userId,
      household_id: updated.householdId,
      item_id: updated.itemId,
      type: updated.type,
      title: updated.title,
      body: updated.body,
      read_at: updated.readAt?.toISOString() ?? null,
      created_at: updated.createdAt.toISOString(),
    } satisfies Notification;
  },

  async getProfilesByIds(ids: string[]) {
    const rows = await prisma.profile.findMany({ where: { id: { in: ids } } });
    return rows.map(mapProfile);
  },

  async getCalendarItems() {
    const items = await this.listItems();
    return items.filter((i) => i.due_date);
  },

  async updateNotificationPrefs(prefs: Partial<{
    assignments: boolean;
    comments: boolean;
    mentions: boolean;
    decisions: boolean;
    deadlines: boolean;
    contributions: boolean;
  }>) {
    const user = await requireUser();
    const row = await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...prefs },
      update: prefs,
    });
    return {
      user_id: row.userId,
      assignments: row.assignments,
      comments: row.comments,
      mentions: row.mentions,
      decisions: row.decisions,
      deadlines: row.deadlines,
      contributions: row.contributions,
    };
  },

  async getNotificationPrefs() {
    const user = await requireUser();
    const row = await prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    });
    return {
      user_id: user.id,
      assignments: row?.assignments ?? true,
      comments: row?.comments ?? true,
      mentions: row?.mentions ?? true,
      decisions: row?.decisions ?? true,
      deadlines: row?.deadlines ?? true,
      contributions: row?.contributions ?? true,
    };
  },

  async createWellnessCheckIn(input: {
    mental: number;
    physical: number;
    emotional: number;
    note?: string;
  }) {
    const ctx = await this.getHouseholdContext();
    if (!ctx) throw new Error("No household");

    const row = await prisma.wellnessCheckIn.create({
      data: {
        householdId: ctx.household.id,
        userId: ctx.currentUser.id,
        mental: input.mental,
        physical: input.physical,
        emotional: input.emotional,
        note: encryptSecret(input.note),
      },
    });

    const partners = ctx.members.filter((m) => m.user_id !== ctx.currentUser.id);
    for (const partner of partners) {
      await prisma.notification.create({
        data: {
          userId: partner.user_id,
          householdId: ctx.household.id,
          type: "check_in",
          title: "New check-in",
          body: `${ctx.currentUser.full_name} shared how they're doing.`,
        },
      });
    }

    try {
      const { notifyHouseholdPartners } = await import("@/lib/push");
      await notifyHouseholdPartners({
        householdId: ctx.household.id,
        actorId: ctx.currentUser.id,
        title: "New check-in",
        body: `${ctx.currentUser.full_name} shared how they're doing.`,
        url: "/check-in",
      });
    } catch {
      // optional
    }

    return {
      id: row.id,
      household_id: row.householdId,
      user_id: row.userId,
      mental: row.mental,
      physical: row.physical,
      emotional: row.emotional,
      note: decryptSecret(row.note),
      created_at: row.createdAt.toISOString(),
    };
  },

  async listWellnessCheckIns(userId?: string, limit = 14) {
    const ctx = await this.getHouseholdContext();
    if (!ctx) return [];
    const target = userId ?? ctx.currentUser.id;
    const allowed = ctx.members.some((m) => m.user_id === target);
    if (!allowed) throw new Error("Forbidden");

    const rows = await prisma.wellnessCheckIn.findMany({
      where: { householdId: ctx.household.id, userId: target },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return rows.map((row) => ({
      id: row.id,
      household_id: row.householdId,
      user_id: row.userId,
      mental: row.mental,
      physical: row.physical,
      emotional: row.emotional,
      note: decryptSecret(row.note),
      created_at: row.createdAt.toISOString(),
    }));
  },

  async getLatestWellnessCheckIns() {
    const ctx = await this.getHouseholdContext();
    if (!ctx) return { mine: null, partner: null };

    const [mineRows, partnerRows] = await Promise.all([
      prisma.wellnessCheckIn.findMany({
        where: { householdId: ctx.household.id, userId: ctx.currentUser.id },
        orderBy: { createdAt: "desc" },
        take: 1,
      }),
      ctx.partner
        ? prisma.wellnessCheckIn.findMany({
            where: { householdId: ctx.household.id, userId: ctx.partner.id },
            orderBy: { createdAt: "desc" },
            take: 1,
          })
        : Promise.resolve([]),
    ]);

    const map = (row: (typeof mineRows)[number] | undefined) =>
      row
        ? {
            id: row.id,
            household_id: row.householdId,
            user_id: row.userId,
            mental: row.mental,
            physical: row.physical,
            emotional: row.emotional,
            note: decryptSecret(row.note),
            created_at: row.createdAt.toISOString(),
          }
        : null;

    return { mine: map(mineRows[0]), partner: map(partnerRows[0]) };
  },
};
