export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getRepository } from "@/services";

export default async function HomePage() {
  try {
    const repo = getRepository();
    const user = await repo.getSessionUser();
    if (!user) redirect("/sign-in");
    const ctx = await repo.getHouseholdContext();
    if (!ctx) redirect("/onboarding");
    redirect("/dashboard");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirect("/sign-in");
  }
}
