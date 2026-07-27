import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getRepository } from "@/services";
import type { HouseholdContext } from "@/types";

export async function requireHousehold() {
  const repo = getRepository();
  const user = await repo.getSessionUser();
  if (!user) redirect("/sign-in");
  const ctx = await repo.getHouseholdContext();
  if (!ctx) redirect("/onboarding");
  return { repo, ctx };
}

export function Shell({
  ctx,
  children,
}: {
  ctx: HouseholdContext;
  children: React.ReactNode;
}) {
  return (
    <AppShell currentName={ctx.currentUser.full_name} partnerName={ctx.partner?.full_name}>
      {children}
    </AppShell>
  );
}
