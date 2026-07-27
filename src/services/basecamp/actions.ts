"use server";

import { revalidatePath } from "next/cache";
import {
  isBasecampUnlocked,
  lockBasecamp,
  unlockBasecamp,
  verifyBasecampPasscode,
} from "@/lib/basecamp-auth";
import { basecampService } from "@/services/basecamp/service";
import type { YnmVote } from "@/types/basecamp";

export async function unlockBasecampAction(code: string) {
  if (!verifyBasecampPasscode(code)) {
    return { ok: false as const, error: "Wrong code" };
  }
  await unlockBasecamp();
  return { ok: true as const };
}

export async function lockBasecampAction() {
  await lockBasecamp();
  revalidatePath("/basecamp");
}

export async function basecampUnlockedAction() {
  return isBasecampUnlocked();
}

function revalidateBasecamp() {
  revalidatePath("/basecamp");
  revalidatePath("/basecamp/ynm");
  revalidatePath("/basecamp/coupons");
  revalidatePath("/basecamp/missions");
  revalidatePath("/basecamp/goals");
  revalidatePath("/basecamp/notes");
}

export async function setYnmVoteAction(formData: FormData) {
  const itemId = String(formData.get("itemId") || "");
  const vote = String(formData.get("vote") || "unset") as YnmVote;
  await basecampService.setYnmVote(itemId, vote);
  revalidateBasecamp();
}

export async function addYnmAction(formData: FormData) {
  await basecampService.addYnm({
    title: String(formData.get("title") || ""),
    category: String(formData.get("category") || "Custom"),
    notes: String(formData.get("notes") || "") || undefined,
  });
  revalidateBasecamp();
}

export async function addCouponAction(formData: FormData) {
  await basecampService.addCoupon({
    title: String(formData.get("title") || ""),
    body: String(formData.get("body") || ""),
  });
  revalidateBasecamp();
}

export async function redeemCouponAction(formData: FormData) {
  await basecampService.redeemCoupon(String(formData.get("id") || ""));
  revalidateBasecamp();
}

export async function addMissionAction(formData: FormData) {
  await basecampService.addMission({
    title: String(formData.get("title") || ""),
    details: String(formData.get("details") || "") || undefined,
    reward: String(formData.get("reward") || ""),
  });
  revalidateBasecamp();
}

export async function completeMissionAction(formData: FormData) {
  await basecampService.completeMission(String(formData.get("id") || ""));
  revalidateBasecamp();
}

export async function addGoalAction(formData: FormData) {
  await basecampService.addGoal({
    title: String(formData.get("title") || ""),
    details: String(formData.get("details") || "") || undefined,
    target: Number(formData.get("target") || 1),
  });
  revalidateBasecamp();
}

export async function bumpGoalAction(formData: FormData) {
  await basecampService.bumpGoal(
    String(formData.get("id") || ""),
    Number(formData.get("delta") || 1)
  );
  revalidateBasecamp();
}

export async function addNoteAction(formData: FormData) {
  await basecampService.addNote({
    body: String(formData.get("body") || ""),
    heat: Number(formData.get("heat") || 3),
  });
  revalidateBasecamp();
}
