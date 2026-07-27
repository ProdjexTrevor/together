import { dollarsToCents } from "@/lib/money";
import { utcNowIso } from "@/lib/dates";
import type { CreateItemInput } from "@/lib/validations";
import type {
  ActivityEvent,
  Comment,
  CommentReaction,
  FinancialContribution,
  HouseholdContext,
  Item,
  ItemType,
  ItemWithMeta,
  Notification,
  Profile,
} from "@/types";
import { DEMO_PASSWORD, IDS, createSeedState, type DemoState } from "./seed";
import {
  clearDemoSessionUserId,
  readDemoSessionUserId,
  writeDemoSessionUserId,
} from "./session-cookie";
import {
  clearDemoStateCookie,
  readDemoStateCookie,
  writeDemoStateCookie,
} from "./state-cookie";
import { cache } from "react";

declare global {
  // eslint-disable-next-line no-var
  var __togetherDemoState: DemoState | undefined;
}

const loadRequestState = cache(async () => {
  const fromCookie = await readDemoStateCookie();
  globalThis.__togetherDemoState = fromCookie ?? createSeedState();
  const sessionId = await readDemoSessionUserId();
  globalThis.__togetherDemoState.sessionUserId = sessionId;
  return globalThis.__togetherDemoState;
});

async function ensureState(): Promise<DemoState> {
  // Vitest has no per-request boundary; keep one mutable state object.
  if (process.env.VITEST === "true") {
    if (!globalThis.__togetherDemoState) {
      globalThis.__togetherDemoState =
        (await readDemoStateCookie()) ?? createSeedState();
    }
    const sessionId = await readDemoSessionUserId();
    globalThis.__togetherDemoState.sessionUserId = sessionId;
    return globalThis.__togetherDemoState;
  }

  // Next.js: hydrate once per request from the cookie so creates survive redirects.
  return loadRequestState();
}

function state(): DemoState {
  if (!globalThis.__togetherDemoState) {
    globalThis.__togetherDemoState = createSeedState();
  }
  return globalThis.__togetherDemoState;
}

async function persist() {
  await writeDemoStateCookie(state());
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function requireUser(): Profile {
  const s = state();
  if (!s.sessionUserId) throw new Error("Not authenticated");
  const profile = s.profiles.find((p) => p.id === s.sessionUserId);
  if (!profile) throw new Error("User not found");
  return profile;
}

function householdIdForUser(userId: string): string | null {
  const member = state().members.find((m) => m.user_id === userId && m.status === "active");
  return member?.household_id ?? null;
}

function assertHouseholdAccess(itemHouseholdId: string, userId: string) {
  const hid = householdIdForUser(userId);
  if (!hid || hid !== itemHouseholdId) {
    throw new Error("Forbidden: cross-household access denied");
  }
}

function enrichItem(item: Item): ItemWithMeta {
  const s = state();
  const comment_count = s.comments.filter((c) => c.item_id === item.id).length;
  const base: ItemWithMeta = { ...item, comment_count };

  if (item.type === "task") {
    base.checklist = s.checklist
      .filter((c) => c.item_id === item.id)
      .sort((a, b) => a.sort_order - b.sort_order);
  }
  if (item.type === "decision") {
    base.options = s.options
      .filter((o) => o.item_id === item.id)
      .sort((a, b) => a.sort_order - b.sort_order);
    base.responses = s.responses.filter((r) => r.item_id === item.id);
    const outcome = s.decidedOutcomes[item.id];
    if (outcome) {
      base.decided_option_id = outcome.option_id;
      base.outcome = outcome.summary;
    }
  }
  if (item.type === "goal") {
    base.goal = s.goalDetails.find((g) => g.item_id === item.id) ?? null;
    base.milestones = s.milestones
      .filter((m) => m.item_id === item.id)
      .sort((a, b) => a.sort_order - b.sort_order);
  }
  if (item.type === "financial_target") {
    base.financial = s.financialDetails.find((f) => f.item_id === item.id) ?? null;
    base.contributions = s.contributions
      .filter((c) => c.item_id === item.id)
      .sort((a, b) => b.contributed_at.localeCompare(a.contributed_at));
  }
  return base;
}

function pushActivity(
  householdId: string,
  itemId: string | null,
  actorId: string,
  event_type: string,
  summary: string,
  metadata: Record<string, unknown> | null = null
) {
  const event: ActivityEvent = {
    id: id("act"),
    household_id: householdId,
    item_id: itemId,
    actor_id: actorId,
    event_type,
    summary,
    metadata,
    created_at: utcNowIso(),
  };
  state().activity.unshift(event);
  return event;
}

export const demoRepository = {
  async reset() {
    await clearDemoStateCookie();
    await clearDemoSessionUserId();
    globalThis.__togetherDemoState = createSeedState();
  },

  async signIn(email: string, password?: string) {
    await ensureState();
    const s = state();
    const profile = s.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!profile) throw new Error("No demo account found for that email");
    if (password && password !== DEMO_PASSWORD) throw new Error("Invalid password");
    s.sessionUserId = profile.id;
    await writeDemoSessionUserId(profile.id);
    await persist();
    return profile;
  },

  async signInMagic(email: string) {
    return this.signIn(email);
  },

  async signOut() {
    await ensureState();
    state().sessionUserId = null;
    await clearDemoSessionUserId();
    await persist();
  },

  async getSessionUser() {
    await ensureState();
    const s = state();
    const cookieUserId = await readDemoSessionUserId();
    if (!cookieUserId) {
      s.sessionUserId = null;
      return null;
    }
    s.sessionUserId = cookieUserId;
    return s.profiles.find((p) => p.id === cookieUserId) ?? null;
  },

  async getHouseholdContext(): Promise<HouseholdContext | null> {
    const user = await this.getSessionUser();
    if (!user) return null;
    await ensureState();
    const s = state();
    const membership = s.members.find((m) => m.user_id === user.id && m.status === "active");
    if (!membership) return null;
    const household = s.households.find((h) => h.id === membership.household_id);
    if (!household) return null;
    const members = s.members
      .filter((m) => m.household_id === household.id && m.status === "active")
      .map((m) => {
        const profile = s.profiles.find((p) => p.id === m.user_id)!;
        return { ...m, profile };
      });
    const partner = members.find((m) => m.user_id !== user.id)?.profile ?? null;
    return { household, members, currentUser: user, partner };
  },

  async createHousehold(fullName: string, householdName: string, partnerEmail?: string) {
    await ensureState();
    const s = state();
    let user = await this.getSessionUser();
    if (!user) {
      user = {
        id: id("user"),
        email: `user-${Date.now()}@together.app`,
        full_name: fullName,
        avatar_url: null,
        timezone: "America/Chicago",
        created_at: utcNowIso(),
        updated_at: utcNowIso(),
      };
      s.profiles.push(user);
      s.sessionUserId = user.id;
      await writeDemoSessionUserId(user.id);
    } else {
      user.full_name = fullName;
      user.updated_at = utcNowIso();
    }

    const household = {
      id: id("hh"),
      name: householdName,
      created_by: user.id,
      created_at: utcNowIso(),
      updated_at: utcNowIso(),
    };
    s.households.push(household);
    s.members.push({
      id: id("mem"),
      household_id: household.id,
      user_id: user.id,
      role: "creator",
      status: "active",
      joined_at: utcNowIso(),
      created_at: utcNowIso(),
    });

    let invitationToken: string | null = null;
    if (partnerEmail) {
      invitationToken = id("inv");
      s.invitations.push({
        id: id("invite"),
        household_id: household.id,
        email: partnerEmail,
        token: invitationToken,
        invited_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        accepted_at: null,
        created_at: utcNowIso(),
      });
    }

    await persist();
    return { household, invitationToken };
  },

  async getInvitation(token: string) {
    await ensureState();
    return state().invitations.find((i) => i.token === token) ?? null;
  },

  async acceptInvitation(token: string, fullName: string) {
    await ensureState();
    const s = state();
    const invitation = s.invitations.find((i) => i.token === token);
    if (!invitation) throw new Error("Invitation not found");
    if (invitation.accepted_at) throw new Error("Invitation already used");
    if (new Date(invitation.expires_at) < new Date()) throw new Error("Invitation expired");

    const activeCount = s.members.filter(
      (m) => m.household_id === invitation.household_id && m.status === "active"
    ).length;
    if (activeCount >= 2) throw new Error("Household is full");

    let user = await this.getSessionUser();
    if (!user) {
      user = {
        id: id("user"),
        email: invitation.email,
        full_name: fullName,
        avatar_url: null,
        timezone: "America/Chicago",
        created_at: utcNowIso(),
        updated_at: utcNowIso(),
      };
      s.profiles.push(user);
      s.sessionUserId = user.id;
      await writeDemoSessionUserId(user.id);
    }

    invitation.accepted_at = utcNowIso();
    s.members.push({
      id: id("mem"),
      household_id: invitation.household_id,
      user_id: user.id,
      role: "partner",
      status: "active",
      joined_at: utcNowIso(),
      created_at: utcNowIso(),
    });
    await persist();
    return user;
  },

  async listItems(type?: ItemType, opts?: { archived?: boolean; search?: string }) {
    const ctx = await this.getHouseholdContext();
    if (!ctx) return [];
    await ensureState();
    const s = state();
    let items = s.items.filter((i) => i.household_id === ctx.household.id);
    if (type) items = items.filter((i) => i.type === type);
    if (opts?.archived) items = items.filter((i) => i.archived_at);
    else items = items.filter((i) => !i.archived_at);
    if (opts?.search) {
      const q = opts.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.description?.toLowerCase().includes(q) ?? false)
      );
    }
    return items
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .map(enrichItem);
  },

  async getItem(itemId: string) {
    await ensureState();
    const user = requireUser();
    const item = state().items.find((i) => i.id === itemId);
    if (!item) return null;
    assertHouseholdAccess(item.household_id, user.id);
    return enrichItem(item);
  },

  async createItem(input: CreateItemInput) {
    await ensureState();
    const ctx = await this.getHouseholdContext();
    if (!ctx) throw new Error("No household");
    const ownerId =
      input.owner === "both"
        ? null
        : input.owner === "self"
          ? ctx.currentUser.id
          : ctx.partner?.id ?? null;

    const item: Item = {
      id: id("item"),
      household_id: ctx.household.id,
      type: input.type,
      title: input.title,
      description: input.description || null,
      status:
        input.type === "task"
          ? "not_started"
          : input.type === "decision"
            ? "collecting_options"
            : "not_started",
      created_by: ctx.currentUser.id,
      owner_id: ownerId,
      priority: input.priority ?? "normal",
      start_date: input.start_date || null,
      due_date: input.due_date || null,
      completed_at: null,
      archived_at: null,
      created_at: utcNowIso(),
      updated_at: utcNowIso(),
    };

    const s = state();
    s.items.unshift(item);

    if (input.type === "task" && input.checklist?.length) {
      input.checklist.forEach((title, index) => {
        s.checklist.push({
          id: id("cl"),
          item_id: item.id,
          title,
          completed: false,
          sort_order: index,
          created_at: utcNowIso(),
        });
      });
    }

    if (input.type === "decision") {
      (input.options ?? []).forEach((opt, index) => {
        s.options.push({
          id: id("opt"),
          item_id: item.id,
          title: opt.title,
          description: null,
          pros: opt.pros ?? [],
          cons: opt.cons ?? [],
          image_url: null,
          sort_order: index,
          created_at: utcNowIso(),
        });
      });
      if ((input.options?.length ?? 0) > 0) {
        item.status = "awaiting_response";
      }
    }

    if (input.type === "goal") {
      s.goalDetails.push({
        item_id: item.id,
        tracking_type: input.tracking_type ?? "habit",
        target_value: input.target_value ?? 12,
        current_value: 0,
        unit: "weeks",
        weekly_frequency: input.weekly_frequency ?? 1,
        streak_count: 0,
      });
      item.status = "on_track";
    }

    if (input.type === "financial_target") {
      const target = dollarsToCents(Number(input.target_amount ?? 0));
      const current = dollarsToCents(Number(input.current_amount ?? 0));
      s.financialDetails.push({
        item_id: item.id,
        target_amount_cents: target,
        current_amount_cents: current,
      });
      item.status = current >= target && target > 0 ? "reached" : current > 0 ? "on_track" : "not_started";
    }

    pushActivity(
      ctx.household.id,
      item.id,
      ctx.currentUser.id,
      "created",
      `Created by ${ctx.currentUser.full_name}`
    );

    if (ownerId && ownerId !== ctx.currentUser.id) {
      s.notifications.unshift({
        id: id("n"),
        user_id: ownerId,
        household_id: ctx.household.id,
        item_id: item.id,
        type: "assignment",
        title: "New assignment",
        body: `${ctx.currentUser.full_name} assigned ${item.title} to you.`,
        read_at: null,
        created_at: utcNowIso(),
      });
    }

    await persist();
    return enrichItem(item);
  },

  async deleteItem(itemId: string) {
    await ensureState();
    const user = requireUser();
    const s = state();
    const item = s.items.find((i) => i.id === itemId);
    if (!item) throw new Error("Item not found");
    assertHouseholdAccess(item.household_id, user.id);

    const type = item.type;
    const commentIds = new Set(s.comments.filter((c) => c.item_id === itemId).map((c) => c.id));

    s.items = s.items.filter((i) => i.id !== itemId);
    s.checklist = s.checklist.filter((c) => c.item_id !== itemId);
    s.options = s.options.filter((o) => o.item_id !== itemId);
    s.responses = s.responses.filter((r) => r.item_id !== itemId);
    s.goalDetails = s.goalDetails.filter((g) => g.item_id !== itemId);
    s.milestones = s.milestones.filter((m) => m.item_id !== itemId);
    s.financialDetails = s.financialDetails.filter((f) => f.item_id !== itemId);
    s.contributions = s.contributions.filter((c) => c.item_id !== itemId);
    s.comments = s.comments.filter((c) => c.item_id !== itemId);
    s.reactions = s.reactions.filter((r) => !commentIds.has(r.comment_id));
    s.activity = s.activity.filter((a) => a.item_id !== itemId);
    s.notifications = s.notifications.filter((n) => n.item_id !== itemId);
    delete s.decidedOutcomes[itemId];

    pushActivity(
      item.household_id,
      null,
      user.id,
      "deleted",
      `${user.full_name} deleted "${item.title}"`
    );

    await persist();
    return { id: itemId, type };
  },

  async updateItemStatus(itemId: string, status: Item["status"]) {
    await ensureState();
    const user = requireUser();
    const item = state().items.find((i) => i.id === itemId);
    if (!item) throw new Error("Item not found");
    assertHouseholdAccess(item.household_id, user.id);
    item.status = status;
    item.updated_at = utcNowIso();
    if (status === "completed" || status === "decided" || status === "reached") {
      item.completed_at = utcNowIso();
    }
    pushActivity(
      item.household_id,
      item.id,
      user.id,
      "status_changed",
      `Status changed to ${status.replaceAll("_", " ")}`
    );
    await persist();
    return enrichItem(item);
  },

  async toggleTaskComplete(itemId: string) {
    await ensureState();
    const item = await this.getItem(itemId);
    if (!item || item.type !== "task") throw new Error("Task not found");
    const next = item.status === "completed" ? "not_started" : "completed";
    return this.updateItemStatus(itemId, next);
  },

  async recordDecisionResponse(itemId: string, optionId: string, note?: string) {
    await ensureState();
    const user = requireUser();
    const item = state().items.find((i) => i.id === itemId);
    if (!item) throw new Error("Decision not found");
    assertHouseholdAccess(item.household_id, user.id);
    const s = state();
    const existing = s.responses.find((r) => r.item_id === itemId && r.user_id === user.id);
    if (existing) {
      existing.option_id = optionId;
      existing.note = note ?? null;
      existing.updated_at = utcNowIso();
    } else {
      s.responses.push({
        id: id("resp"),
        item_id: itemId,
        option_id: optionId,
        user_id: user.id,
        note: note ?? null,
        created_at: utcNowIso(),
        updated_at: utcNowIso(),
      });
    }
    item.status = "discussion";
    item.updated_at = utcNowIso();
    pushActivity(
      item.household_id,
      item.id,
      user.id,
      "response_recorded",
      `${user.full_name} recorded a response`
    );
    await persist();
    return enrichItem(item);
  },

  async decideOutcome(itemId: string, optionId: string, summary: string) {
    await ensureState();
    const user = requireUser();
    const item = state().items.find((i) => i.id === itemId);
    if (!item) throw new Error("Decision not found");
    assertHouseholdAccess(item.household_id, user.id);
    state().decidedOutcomes[itemId] = { option_id: optionId, summary };
    item.status = "decided";
    item.completed_at = utcNowIso();
    item.updated_at = utcNowIso();
    pushActivity(item.household_id, item.id, user.id, "decided", `Decision finalized`);
    await persist();
    return enrichItem(item);
  },

  async addContribution(itemId: string, amountDollars: number, note?: string) {
    await ensureState();
    const user = requireUser();
    const item = state().items.find((i) => i.id === itemId);
    if (!item || item.type !== "financial_target") throw new Error("Target not found");
    assertHouseholdAccess(item.household_id, user.id);
    const s = state();
    const details = s.financialDetails.find((f) => f.item_id === itemId);
    if (!details) throw new Error("Financial details missing");

    const contribution: FinancialContribution = {
      id: id("contrib"),
      item_id: itemId,
      amount_cents: dollarsToCents(amountDollars),
      contributor_id: user.id,
      contributed_at: utcNowIso(),
      note: note || null,
      created_at: utcNowIso(),
    };
    s.contributions.unshift(contribution);
    details.current_amount_cents += contribution.amount_cents;
    if (details.current_amount_cents >= details.target_amount_cents) {
      item.status = "reached";
      item.completed_at = utcNowIso();
    } else {
      item.status = "on_track";
    }
    item.updated_at = utcNowIso();
    pushActivity(
      item.household_id,
      item.id,
      user.id,
      "contribution_added",
      `${user.full_name} added a contribution`
    );

    const partnerId = ctxPartnerId(item.household_id, user.id);
    if (partnerId) {
      s.notifications.unshift({
        id: id("n"),
        user_id: partnerId,
        household_id: item.household_id,
        item_id: item.id,
        type: "contribution",
        title: "New contribution",
        body: `${user.full_name} added to ${item.title}.`,
        read_at: null,
        created_at: utcNowIso(),
      });
    }

    await persist();
    return enrichItem(item);
  },

  async updateGoalProgress(itemId: string, currentValue: number) {
    await ensureState();
    const user = requireUser();
    const item = state().items.find((i) => i.id === itemId);
    if (!item) throw new Error("Goal not found");
    assertHouseholdAccess(item.household_id, user.id);
    const goal = state().goalDetails.find((g) => g.item_id === itemId);
    if (!goal) throw new Error("Goal details missing");
    goal.current_value = currentValue;
    if (goal.target_value && currentValue >= goal.target_value) {
      item.status = "completed";
      item.completed_at = utcNowIso();
    } else {
      item.status = "on_track";
    }
    item.updated_at = utcNowIso();
    pushActivity(
      item.household_id,
      item.id,
      user.id,
      "progress_updated",
      `${user.full_name} updated progress`
    );
    await persist();
    return enrichItem(item);
  },

  async listComments(itemId: string) {
    await ensureState();
    const item = await this.getItem(itemId);
    if (!item) return [];
    return state()
      .comments.filter((c) => c.item_id === itemId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  async listReactions(itemId: string) {
    await ensureState();
    const comments = await this.listComments(itemId);
    const ids = new Set(comments.map((c) => c.id));
    return state().reactions.filter((r) => ids.has(r.comment_id));
  },

  async addComment(itemId: string, body: string, parentId?: string | null) {
    await ensureState();
    const user = requireUser();
    const item = state().items.find((i) => i.id === itemId);
    if (!item) throw new Error("Item not found");
    assertHouseholdAccess(item.household_id, user.id);
    const comment: Comment = {
      id: id("c"),
      item_id: itemId,
      user_id: user.id,
      parent_id: parentId ?? null,
      body,
      edited_at: null,
      created_at: utcNowIso(),
      updated_at: utcNowIso(),
    };
    state().comments.push(comment);
    item.updated_at = utcNowIso();

    const partnerId = ctxPartnerId(item.household_id, user.id);
    if (partnerId) {
      const mentioned = /@partner/i.test(body);
      state().notifications.unshift({
        id: id("n"),
        user_id: partnerId,
        household_id: item.household_id,
        item_id: item.id,
        type: mentioned ? "mention" : "comment",
        title: mentioned ? "You were mentioned" : "New comment",
        body: `${user.full_name} commented on ${item.title}.`,
        read_at: null,
        created_at: utcNowIso(),
      });
    }
    await persist();
    return comment;
  },

  async addReaction(commentId: string, emoji: string) {
    await ensureState();
    const user = requireUser();
    const comment = state().comments.find((c) => c.id === commentId);
    if (!comment) throw new Error("Comment not found");
    const item = state().items.find((i) => i.id === comment.item_id)!;
    assertHouseholdAccess(item.household_id, user.id);
    const existing = state().reactions.find(
      (r) => r.comment_id === commentId && r.user_id === user.id && r.emoji === emoji
    );
    if (existing) return existing;
    const reaction: CommentReaction = {
      id: id("r"),
      comment_id: commentId,
      user_id: user.id,
      emoji,
      created_at: utcNowIso(),
    };
    state().reactions.push(reaction);
    await persist();
    return reaction;
  },

  async listActivity(itemId: string) {
    await ensureState();
    const item = await this.getItem(itemId);
    if (!item) return [];
    return state()
      .activity.filter((a) => a.item_id === itemId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async listNotifications() {
    await ensureState();
    const user = requireUser();
    return state()
      .notifications.filter((n) => n.user_id === user.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)) as Notification[];
  },

  async markNotificationRead(notificationId: string) {
    await ensureState();
    const user = requireUser();
    const n = state().notifications.find((x) => x.id === notificationId && x.user_id === user.id);
    if (n) n.read_at = utcNowIso();
    await persist();
    return n ?? null;
  },

  async getProfilesByIds(ids: string[]) {
    await ensureState();
    return state().profiles.filter((p) => ids.includes(p.id));
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
    await ensureState();
    const user = requireUser();
    const s = state();
    let row = s.notificationPrefs.find((p) => p.user_id === user.id);
    if (!row) {
      row = {
        user_id: user.id,
        assignments: true,
        comments: true,
        mentions: true,
        decisions: true,
        deadlines: true,
        contributions: true,
      };
      s.notificationPrefs.push(row);
    }
    Object.assign(row, prefs);
    await persist();
    return row;
  },

  async getNotificationPrefs() {
    await ensureState();
    const user = requireUser();
    return (
      state().notificationPrefs.find((p) => p.user_id === user.id) ?? {
        user_id: user.id,
        assignments: true,
        comments: true,
        mentions: true,
        decisions: true,
        deadlines: true,
        contributions: true,
      }
    );
  },

  async createWellnessCheckIn(input: {
    mental: number;
    physical: number;
    emotional: number;
    note?: string;
  }) {
    await ensureState();
    const user = requireUser();
    const hid = householdIdForUser(user.id);
    if (!hid) throw new Error("No household");
    const row = {
      id: id("checkin"),
      household_id: hid,
      user_id: user.id,
      mental: input.mental,
      physical: input.physical,
      emotional: input.emotional,
      note: input.note?.trim() || null,
      created_at: utcNowIso(),
    };
    state().checkIns ??= [];
    state().checkIns.unshift(row);
    const partnerId = ctxPartnerId(hid, user.id);
    if (partnerId) {
      state().notifications.unshift({
        id: id("notif"),
        user_id: partnerId,
        household_id: hid,
        item_id: null,
        type: "check_in",
        title: "New check-in",
        body: `${user.full_name} shared how they're doing.`,
        read_at: null,
        created_at: utcNowIso(),
      });
    }
    await persist();
    return row;
  },

  async listWellnessCheckIns(userId?: string, limit = 14) {
    await ensureState();
    const user = requireUser();
    const hid = householdIdForUser(user.id);
    if (!hid) return [];
    const target = userId ?? user.id;
    // Household members can see each other's check-ins
    const memberIds = state()
      .members.filter((m) => m.household_id === hid && m.status === "active")
      .map((m) => m.user_id);
    if (!memberIds.includes(target)) throw new Error("Forbidden");
    if (!Array.isArray(state().checkIns)) state().checkIns = [];
    return state()
      .checkIns.filter((c) => c.household_id === hid && c.user_id === target)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  },

  async getLatestWellnessCheckIns() {
    await ensureState();
    const user = requireUser();
    const hid = householdIdForUser(user.id);
    if (!hid) return { mine: null, partner: null };
    if (!Array.isArray(state().checkIns)) state().checkIns = [];
    const partnerId = ctxPartnerId(hid, user.id);
    const mine =
      state()
        .checkIns.filter((c) => c.household_id === hid && c.user_id === user.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
    const partner =
      partnerId
        ? state()
            .checkIns.filter((c) => c.household_id === hid && c.user_id === partnerId)
            .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
        : null;
    return { mine, partner };
  },

  async listWebAuthnCredentials(userId?: string) {
    await ensureState();
    const user = requireUser();
    const target = userId ?? user.id;
    if (target !== user.id) throw new Error("Forbidden");
    if (!Array.isArray(state().webauthnCredentials)) state().webauthnCredentials = [];
    return state().webauthnCredentials.filter((c) => c.user_id === target);
  },

  async saveWebAuthnCredential(input: {
    credential_id: string;
    public_key: string;
    counter: number;
    transports?: string[];
    device_type?: string;
    backed_up?: boolean;
  }) {
    await ensureState();
    const user = requireUser();
    if (!Array.isArray(state().webauthnCredentials)) state().webauthnCredentials = [];
    state().webauthnCredentials = state().webauthnCredentials.filter(
      (c) => !(c.user_id === user.id && c.credential_id === input.credential_id)
    );
    state().webauthnCredentials.push({
      id: id("webauthn"),
      user_id: user.id,
      credential_id: input.credential_id,
      public_key: input.public_key,
      counter: input.counter,
      transports: input.transports ?? [],
      device_type: input.device_type ?? "singleDevice",
      backed_up: input.backed_up ?? false,
      created_at: utcNowIso(),
    });
    await persist();
    return { ok: true as const };
  },

  async updateWebAuthnCounter(credentialId: string, counter: number) {
    await ensureState();
    const user = requireUser();
    const row = state().webauthnCredentials.find(
      (c) => c.user_id === user.id && c.credential_id === credentialId
    );
    if (row) {
      row.counter = counter;
      await persist();
    }
  },

  async clearWebAuthnCredentials(userId?: string) {
    await ensureState();
    const user = requireUser();
    const target = userId ?? user.id;
    if (target !== user.id) throw new Error("Forbidden");
    state().webauthnCredentials = state().webauthnCredentials.filter((c) => c.user_id !== target);
    await persist();
  },
};

function ctxPartnerId(householdId: string, userId: string): string | null {
  const partner = state().members.find(
    (m) => m.household_id === householdId && m.user_id !== userId && m.status === "active"
  );
  return partner?.user_id ?? null;
}

export { IDS, DEMO_PASSWORD };

