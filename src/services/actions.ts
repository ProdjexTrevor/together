"use server";

import { revalidatePath } from "next/cache";
import { createItemSchema, type CreateItemInput } from "@/lib/validations";
import { getRepository } from "@/services";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const mode = String(formData.get("mode") ?? "password");
  const repo = getRepository();
  if (mode === "magic") {
    await repo.signInMagic(email);
  } else {
    await repo.signIn(email, password);
  }
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function signOutAction() {
  await getRepository().signOut();
  revalidatePath("/", "layout");
}

export async function createHouseholdAction(formData: FormData) {
  const full_name = String(formData.get("full_name") ?? "");
  const household_name = String(formData.get("household_name") ?? "");
  const partner_email = String(formData.get("partner_email") ?? "");
  const result = await getRepository().createHousehold(
    full_name,
    household_name,
    partner_email || undefined
  );
  revalidatePath("/", "layout");
  return result;
}

export async function acceptInviteAction(token: string, formData: FormData) {
  const full_name = String(formData.get("full_name") ?? "");
  await getRepository().acceptInvitation(token, full_name);
  revalidatePath("/", "layout");
}

export async function createItemAction(raw: CreateItemInput) {
  const parsed = createItemSchema.parse(raw);
  const item = await getRepository().createItem(parsed);
  revalidatePath("/dashboard");
  revalidatePath(`/${pathForType(item.type)}`);
  return item;
}

export async function toggleTaskAction(itemId: string) {
  const item = await getRepository().toggleTaskComplete(itemId);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath(`/tasks/${itemId}`);
  return item;
}

export async function recordDecisionResponseAction(
  itemId: string,
  optionId: string,
  note?: string
) {
  const item = await getRepository().recordDecisionResponse(itemId, optionId, note);
  revalidatePath(`/decisions/${itemId}`);
  revalidatePath("/decisions");
  revalidatePath("/dashboard");
  return item;
}

export async function addCommentAction(itemId: string, body: string, parentId?: string) {
  const comment = await getRepository().addComment(itemId, body, parentId);
  revalidatePathByItem(itemId);
  return comment;
}

export async function addReactionAction(commentId: string, emoji: string, itemId: string) {
  const reaction = await getRepository().addReaction(commentId, emoji);
  revalidatePathByItem(itemId);
  return reaction;
}

export async function addContributionAction(itemId: string, amount: number, note?: string) {
  const item = await getRepository().addContribution(itemId, amount, note);
  revalidatePath(`/finances/${itemId}`);
  revalidatePath("/finances");
  revalidatePath("/dashboard");
  return item;
}

export async function updateGoalProgressAction(itemId: string, currentValue: number) {
  const item = await getRepository().updateGoalProgress(itemId, currentValue);
  revalidatePath(`/goals/${itemId}`);
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return item;
}

export async function updateNotificationPrefsAction(prefs: Record<string, boolean>) {
  const result = await getRepository().updateNotificationPrefs(prefs);
  revalidatePath("/settings");
  return result;
}

export async function createWellnessCheckInAction(raw: {
  mental: number;
  physical: number;
  emotional: number;
  note?: string;
}) {
  const { wellnessCheckInSchema } = await import("@/lib/validations");
  const parsed = wellnessCheckInSchema.parse(raw);
  const row = await getRepository().createWellnessCheckIn({
    mental: parsed.mental,
    physical: parsed.physical,
    emotional: parsed.emotional,
    note: parsed.note || undefined,
  });
  revalidatePath("/check-in");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return row;
}

export async function deleteItemAction(itemId: string) {
  const deleted = await getRepository().deleteItem(itemId);
  const listPath = `/${pathForType(deleted.type)}`;
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath(listPath);
  revalidatePath(`${listPath}/${itemId}`);
  return deleted;
}

function pathForType(type: string) {
  switch (type) {
    case "task":
      return "tasks";
    case "decision":
      return "decisions";
    case "goal":
      return "goals";
    case "financial_target":
      return "finances";
    default:
      return "dashboard";
  }
}

async function revalidatePathByItem(itemId: string) {
  const item = await getRepository().getItem(itemId);
  if (!item) return;
  revalidatePath(`/${pathForType(item.type)}/${itemId}`);
  revalidatePath(`/${pathForType(item.type)}`);
  revalidatePath("/dashboard");
}
