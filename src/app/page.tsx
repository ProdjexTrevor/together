export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getRepository } from "@/services";

export default async function HomePage() {
  const repo = getRepository();
  const user = await repo.getSessionUser();
  if (!user) redirect("/sign-in");
  const ctx = await repo.getHouseholdContext();
  if (!ctx) redirect("/onboarding");
  redirect("/dashboard");
}
