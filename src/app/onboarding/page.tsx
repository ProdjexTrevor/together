export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { createHouseholdAction } from "@/services/actions";
import { getRepository } from "@/services";

export default async function OnboardingPage() {
  const repo = getRepository();
  const user = await repo.getSessionUser();
  const ctx = await repo.getHouseholdContext();
  if (user && ctx) redirect("/dashboard");

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <Logo className="mb-8 justify-center" />
      <Card className="p-6">
        <h1 className="font-display text-3xl text-ink">Start your household</h1>
        <p className="mt-2 text-sm text-muted">
          Create a private space for two. Invite your partner when you&apos;re ready.
        </p>
        <form
          action={async (formData) => {
            "use server";
            const result = await createHouseholdAction(formData);
            if (result.invitationToken) {
              redirect(`/invite/${result.invitationToken}?created=1`);
            }
            redirect("/dashboard");
          }}
          className="mt-6 space-y-4"
        >
          <div>
            <Label htmlFor="full_name">Your name</Label>
            <Input id="full_name" name="full_name" required defaultValue="Trevor" />
          </div>
          <div>
            <Label htmlFor="household_name">Household name</Label>
            <Input
              id="household_name"
              name="household_name"
              required
              defaultValue="Our home"
            />
          </div>
          <div>
            <Label htmlFor="partner_email">Partner email (optional)</Label>
            <Input
              id="partner_email"
              name="partner_email"
              type="email"
              placeholder="partner@email.com"
            />
          </div>
          <Button type="submit" className="w-full" size="lg">
            Continue
          </Button>
        </form>
      </Card>
    </div>
  );
}
