import { openBasecamp, sealBasecamp } from "@/lib/basecamp-crypto";
import {
  BASECAMP_COUPON_SEED,
  BASECAMP_MISSION_SEED,
  BASECAMP_YNM_SEED,
} from "@/lib/basecamp-seed";
import { usePrismaDatabase } from "@/lib/db-mode";
import { utcNowIso } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { getRepository } from "@/services";
import { createSeedState, type DemoState } from "@/services/demo/seed";
import {
  readDemoStateCookie,
  writeDemoStateCookie,
} from "@/services/demo/state-cookie";
import { readDemoSessionUserId } from "@/services/demo/session-cookie";
import type {
  BasecampCoupon,
  BasecampGoal,
  BasecampMission,
  BasecampNote,
  BasecampYnmItem,
  YnmVote,
} from "@/types/basecamp";
import { cache } from "react";

function useMysql() {
  return usePrismaDatabase();
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

const loadDemo = cache(async () => {
  const fromCookie = await readDemoStateCookie();
  const state = fromCookie ?? createSeedState();
  const sessionId = await readDemoSessionUserId();
  state.sessionUserId = sessionId;
  if (!state.basecamp) {
    state.basecamp = {
      ynm: [],
      coupons: [],
      missions: [],
      goals: [],
      notes: [],
      seededFor: {},
    };
  }
  globalThis.__togetherDemoState = state;
  return state;
});

async function demoState(): Promise<DemoState> {
  if (process.env.VITEST === "true") {
    if (!globalThis.__togetherDemoState) {
      globalThis.__togetherDemoState = createSeedState();
    }
    return globalThis.__togetherDemoState;
  }
  return loadDemo();
}

async function persistDemo(state: DemoState) {
  await writeDemoStateCookie(state);
}

async function requireCtx() {
  const repo = getRepository();
  const ctx = await repo.getHouseholdContext();
  if (!ctx) throw new Error("No household");
  return ctx;
}

async function ensureSeed(householdId: string, userId: string) {
  if (useMysql()) {
    const count = await prisma.basecampYnm.count({ where: { householdId } });
    if (count > 0) return;
    const now = new Date();
    await prisma.basecampYnm.createMany({
      data: BASECAMP_YNM_SEED.map((row) => ({
        householdId,
        titleEnc: sealBasecamp(row.title),
        categoryEnc: sealBasecamp(row.category),
        notesEnc: row.notes ? sealBasecamp(row.notes) : null,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      })),
    });
    await prisma.basecampCoupon.createMany({
      data: BASECAMP_COUPON_SEED.map((row) => ({
        householdId,
        titleEnc: sealBasecamp(row.title),
        bodyEnc: sealBasecamp(row.body),
        fromUserId: userId,
      })),
    });
    await prisma.basecampMission.createMany({
      data: BASECAMP_MISSION_SEED.map((row) => ({
        householdId,
        titleEnc: sealBasecamp(row.title),
        detailsEnc: row.details ? sealBasecamp(row.details) : null,
        rewardEnc: sealBasecamp(row.reward),
        createdBy: userId,
      })),
    });
    await prisma.basecampGoal.create({
      data: {
        householdId,
        titleEnc: sealBasecamp("Fuck at least 3 times this week"),
        detailsEnc: sealBasecamp("Quality over rush — but don't let the week go soft."),
        target: 3,
        createdBy: userId,
      },
    });
    return;
  }

  const state = await demoState();
  if (state.basecamp.seededFor[householdId]) return;
  const now = utcNowIso();
  for (const row of BASECAMP_YNM_SEED) {
    state.basecamp.ynm.push({
      id: id("bcynm"),
      household_id: householdId,
      title: row.title,
      category: row.category,
      notes: row.notes,
      vote_a: "unset",
      vote_b: "unset",
      created_by: userId,
      created_at: now,
      updated_at: now,
    });
  }
  for (const row of BASECAMP_COUPON_SEED) {
    state.basecamp.coupons.push({
      id: id("bccoup"),
      household_id: householdId,
      title: row.title,
      body: row.body,
      from_user_id: userId,
      to_user_id: null,
      status: "available",
      redeemed_at: null,
      created_at: now,
    });
  }
  for (const row of BASECAMP_MISSION_SEED) {
    state.basecamp.missions.push({
      id: id("bcmiss"),
      household_id: householdId,
      title: row.title,
      details: row.details,
      reward: row.reward,
      assigned_to: null,
      status: "open",
      created_by: userId,
      completed_at: null,
      created_at: now,
    });
  }
  state.basecamp.goals.push({
    id: id("bcgoal"),
    household_id: householdId,
    title: "Fuck at least 3 times this week",
    details: "Quality over rush — but don't let the week go soft.",
    target: 3,
    progress: 0,
    created_by: userId,
    created_at: now,
    updated_at: now,
  });
  state.basecamp.seededFor[householdId] = true;
  await persistDemo(state);
}

export const basecampService = {
  async bootstrap() {
    const ctx = await requireCtx();
    await ensureSeed(ctx.household.id, ctx.currentUser.id);
    return { ok: true as const };
  },

  async listYnm() {
    const ctx = await requireCtx();
    await ensureSeed(ctx.household.id, ctx.currentUser.id);
    if (useMysql()) {
      const rows = await prisma.basecampYnm.findMany({
        where: { householdId: ctx.household.id },
        orderBy: { createdAt: "asc" },
      });
      return rows.map(
        (r): BasecampYnmItem => ({
          id: r.id,
          household_id: r.householdId,
          title: openBasecamp(r.titleEnc),
          category: openBasecamp(r.categoryEnc),
          notes: r.notesEnc ? openBasecamp(r.notesEnc) : null,
          vote_a: r.voteA as YnmVote,
          vote_b: r.voteB as YnmVote,
          created_by: r.createdBy,
          created_at: r.createdAt.toISOString(),
          updated_at: r.updatedAt.toISOString(),
        })
      );
    }
    const state = await demoState();
    return state.basecamp.ynm.filter((y) => y.household_id === ctx.household.id);
  },

  async setYnmVote(itemId: string, vote: YnmVote) {
    const ctx = await requireCtx();
    const idx = ctx.members.findIndex((m) => m.user_id === ctx.currentUser.id);
    if (useMysql()) {
      await prisma.basecampYnm.update({
        where: { id: itemId },
        data: idx <= 0 ? { voteA: vote } : { voteB: vote },
      });
      return;
    }
    const state = await demoState();
    const row = state.basecamp.ynm.find(
      (y) => y.id === itemId && y.household_id === ctx.household.id
    );
    if (!row) throw new Error("Not found");
    if (idx <= 0) row.vote_a = vote;
    else row.vote_b = vote;
    row.updated_at = utcNowIso();
    await persistDemo(state);
  },

  async addYnm(input: { title: string; category: string; notes?: string }) {
    const ctx = await requireCtx();
    if (useMysql()) {
      const row = await prisma.basecampYnm.create({
        data: {
          householdId: ctx.household.id,
          titleEnc: sealBasecamp(input.title),
          categoryEnc: sealBasecamp(input.category || "Custom"),
          notesEnc: input.notes ? sealBasecamp(input.notes) : null,
          createdBy: ctx.currentUser.id,
        },
      });
      return row.id;
    }
    const state = await demoState();
    const now = utcNowIso();
    const item: BasecampYnmItem = {
      id: id("bcynm"),
      household_id: ctx.household.id,
      title: input.title,
      category: input.category || "Custom",
      notes: input.notes || null,
      vote_a: "unset",
      vote_b: "unset",
      created_by: ctx.currentUser.id,
      created_at: now,
      updated_at: now,
    };
    state.basecamp.ynm.push(item);
    await persistDemo(state);
    return item.id;
  },

  async listCoupons() {
    const ctx = await requireCtx();
    await ensureSeed(ctx.household.id, ctx.currentUser.id);
    if (useMysql()) {
      const rows = await prisma.basecampCoupon.findMany({
        where: { householdId: ctx.household.id },
        orderBy: { createdAt: "desc" },
      });
      return rows.map(
        (r): BasecampCoupon => ({
          id: r.id,
          household_id: r.householdId,
          title: openBasecamp(r.titleEnc),
          body: openBasecamp(r.bodyEnc),
          from_user_id: r.fromUserId,
          to_user_id: r.toUserId,
          status: r.status as BasecampCoupon["status"],
          redeemed_at: r.redeemedAt?.toISOString() ?? null,
          created_at: r.createdAt.toISOString(),
        })
      );
    }
    const state = await demoState();
    return state.basecamp.coupons.filter((c) => c.household_id === ctx.household.id);
  },

  async addCoupon(input: { title: string; body: string }) {
    const ctx = await requireCtx();
    if (useMysql()) {
      await prisma.basecampCoupon.create({
        data: {
          householdId: ctx.household.id,
          titleEnc: sealBasecamp(input.title),
          bodyEnc: sealBasecamp(input.body),
          fromUserId: ctx.currentUser.id,
          toUserId: ctx.partner?.id ?? null,
        },
      });
      return;
    }
    const state = await demoState();
    state.basecamp.coupons.unshift({
      id: id("bccoup"),
      household_id: ctx.household.id,
      title: input.title,
      body: input.body,
      from_user_id: ctx.currentUser.id,
      to_user_id: ctx.partner?.id ?? null,
      status: "available",
      redeemed_at: null,
      created_at: utcNowIso(),
    });
    await persistDemo(state);
  },

  async redeemCoupon(couponId: string) {
    const ctx = await requireCtx();
    if (useMysql()) {
      await prisma.basecampCoupon.update({
        where: { id: couponId },
        data: { status: "redeemed", redeemedAt: new Date() },
      });
      return;
    }
    const state = await demoState();
    const row = state.basecamp.coupons.find((c) => c.id === couponId);
    if (!row) throw new Error("Not found");
    row.status = "redeemed";
    row.redeemed_at = utcNowIso();
    await persistDemo(state);
  },

  async listMissions() {
    const ctx = await requireCtx();
    await ensureSeed(ctx.household.id, ctx.currentUser.id);
    if (useMysql()) {
      const rows = await prisma.basecampMission.findMany({
        where: { householdId: ctx.household.id },
        orderBy: { createdAt: "desc" },
      });
      return rows.map(
        (r): BasecampMission => ({
          id: r.id,
          household_id: r.householdId,
          title: openBasecamp(r.titleEnc),
          details: r.detailsEnc ? openBasecamp(r.detailsEnc) : null,
          reward: openBasecamp(r.rewardEnc),
          assigned_to: r.assignedTo,
          status: r.status as BasecampMission["status"],
          created_by: r.createdBy,
          completed_at: r.completedAt?.toISOString() ?? null,
          created_at: r.createdAt.toISOString(),
        })
      );
    }
    const state = await demoState();
    return state.basecamp.missions.filter((m) => m.household_id === ctx.household.id);
  },

  async addMission(input: { title: string; details?: string; reward: string }) {
    const ctx = await requireCtx();
    if (useMysql()) {
      await prisma.basecampMission.create({
        data: {
          householdId: ctx.household.id,
          titleEnc: sealBasecamp(input.title),
          detailsEnc: input.details ? sealBasecamp(input.details) : null,
          rewardEnc: sealBasecamp(input.reward),
          assignedTo: ctx.partner?.id ?? null,
          createdBy: ctx.currentUser.id,
        },
      });
      return;
    }
    const state = await demoState();
    state.basecamp.missions.unshift({
      id: id("bcmiss"),
      household_id: ctx.household.id,
      title: input.title,
      details: input.details || null,
      reward: input.reward,
      assigned_to: ctx.partner?.id ?? null,
      status: "open",
      created_by: ctx.currentUser.id,
      completed_at: null,
      created_at: utcNowIso(),
    });
    await persistDemo(state);
  },

  async completeMission(missionId: string) {
    const ctx = await requireCtx();
    if (useMysql()) {
      await prisma.basecampMission.update({
        where: { id: missionId },
        data: { status: "done", completedAt: new Date() },
      });
      return;
    }
    const state = await demoState();
    const row = state.basecamp.missions.find((m) => m.id === missionId);
    if (!row) throw new Error("Not found");
    row.status = "done";
    row.completed_at = utcNowIso();
    await persistDemo(state);
  },

  async listGoals() {
    const ctx = await requireCtx();
    await ensureSeed(ctx.household.id, ctx.currentUser.id);
    if (useMysql()) {
      const rows = await prisma.basecampGoal.findMany({
        where: { householdId: ctx.household.id },
        orderBy: { createdAt: "desc" },
      });
      return rows.map(
        (r): BasecampGoal => ({
          id: r.id,
          household_id: r.householdId,
          title: openBasecamp(r.titleEnc),
          details: r.detailsEnc ? openBasecamp(r.detailsEnc) : null,
          target: r.target,
          progress: r.progress,
          created_by: r.createdBy,
          created_at: r.createdAt.toISOString(),
          updated_at: r.updatedAt.toISOString(),
        })
      );
    }
    const state = await demoState();
    return state.basecamp.goals.filter((g) => g.household_id === ctx.household.id);
  },

  async addGoal(input: { title: string; details?: string; target: number }) {
    const ctx = await requireCtx();
    if (useMysql()) {
      await prisma.basecampGoal.create({
        data: {
          householdId: ctx.household.id,
          titleEnc: sealBasecamp(input.title),
          detailsEnc: input.details ? sealBasecamp(input.details) : null,
          target: input.target,
          createdBy: ctx.currentUser.id,
        },
      });
      return;
    }
    const state = await demoState();
    const now = utcNowIso();
    state.basecamp.goals.unshift({
      id: id("bcgoal"),
      household_id: ctx.household.id,
      title: input.title,
      details: input.details || null,
      target: input.target,
      progress: 0,
      created_by: ctx.currentUser.id,
      created_at: now,
      updated_at: now,
    });
    await persistDemo(state);
  },

  async bumpGoal(goalId: string, delta = 1) {
    const ctx = await requireCtx();
    if (useMysql()) {
      const row = await prisma.basecampGoal.findUnique({ where: { id: goalId } });
      if (!row) throw new Error("Not found");
      await prisma.basecampGoal.update({
        where: { id: goalId },
        data: { progress: Math.max(0, row.progress + delta) },
      });
      return;
    }
    const state = await demoState();
    const row = state.basecamp.goals.find((g) => g.id === goalId);
    if (!row) throw new Error("Not found");
    row.progress = Math.max(0, row.progress + delta);
    row.updated_at = utcNowIso();
    await persistDemo(state);
  },

  async listNotes() {
    const ctx = await requireCtx();
    if (useMysql()) {
      const rows = await prisma.basecampNote.findMany({
        where: { householdId: ctx.household.id },
        orderBy: { createdAt: "desc" },
        take: 40,
      });
      return rows.map(
        (r): BasecampNote => ({
          id: r.id,
          household_id: r.householdId,
          author_id: r.authorId,
          body: openBasecamp(r.bodyEnc),
          heat: r.heat,
          created_at: r.createdAt.toISOString(),
        })
      );
    }
    const state = await demoState();
    return state.basecamp.notes.filter((n) => n.household_id === ctx.household.id);
  },

  async addNote(input: { body: string; heat: number }) {
    const ctx = await requireCtx();
    if (useMysql()) {
      await prisma.basecampNote.create({
        data: {
          householdId: ctx.household.id,
          authorId: ctx.currentUser.id,
          bodyEnc: sealBasecamp(input.body),
          heat: Math.min(5, Math.max(1, input.heat)),
        },
      });
      return;
    }
    const state = await demoState();
    state.basecamp.notes.unshift({
      id: id("bcnote"),
      household_id: ctx.household.id,
      author_id: ctx.currentUser.id,
      body: input.body,
      heat: Math.min(5, Math.max(1, input.heat)),
      created_at: utcNowIso(),
    });
    await persistDemo(state);
  },
};

