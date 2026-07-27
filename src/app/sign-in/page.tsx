export const dynamic = "force-dynamic";

import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { signInAction } from "@/services/actions";
import { DEMO_PASSWORD } from "@/services/demo/repository";
import { redirect } from "next/navigation";
import { getRepository } from "@/services";

export default async function SignInPage() {
  const user = await getRepository().getSessionUser();
  if (user) {
    const ctx = await getRepository().getHouseholdContext();
    redirect(ctx ? "/dashboard" : "/onboarding");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <Logo className="mb-8 justify-center" />
      <Card className="p-6">
        <h1 className="font-display text-3xl text-ink">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to your shared household. Demo accounts use password{" "}
          <code className="rounded bg-page px-1">{DEMO_PASSWORD}</code>.
        </p>

        <form
          action={async (formData) => {
            "use server";
            await signInAction(formData);
            redirect("/");
          }}
          className="mt-6 space-y-4"
        >
          <input type="hidden" name="mode" value="password" />
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue="trevor@together.app"
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              defaultValue={DEMO_PASSWORD}
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" size="lg">
            Sign in
          </Button>
        </form>

        <form
          action={async (formData) => {
            "use server";
            formData.set("mode", "magic");
            await signInAction(formData);
            redirect("/");
          }}
          className="mt-4 space-y-3 border-t border-border pt-4"
        >
          <p className="text-sm text-muted">Or use a magic link (demo signs you in instantly):</p>
          <Input
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            defaultValue="shonda@together.app"
          />
          <Button type="submit" variant="secondary" className="w-full">
            Send magic link
          </Button>
        </form>
      </Card>
      <p className="mt-6 text-center text-sm text-muted">
        New here?{" "}
        <Link href="/onboarding" className="font-medium text-clay">
          Create a household
        </Link>
      </p>
    </div>
  );
}
