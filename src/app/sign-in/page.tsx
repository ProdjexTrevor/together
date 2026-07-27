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

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await getRepository().getSessionUser();
  if (user) {
    const ctx = await getRepository().getHouseholdContext();
    redirect(ctx ? "/dashboard" : "/onboarding");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 flex justify-center">
        <Logo href="/sign-in" />
      </div>
      <Card className="p-6">
        <h1 className="font-display text-3xl text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Enter your household email to continue. Demo password:{" "}
          <code className="rounded bg-page px-1">{DEMO_PASSWORD}</code>
        </p>
        {error ? (
          <p className="mt-3 rounded-[12px] bg-pale-clay px-3 py-2 text-sm text-clay">{error}</p>
        ) : null}

        <form
          action={async (formData) => {
            "use server";
            try {
              await signInAction(formData);
            } catch (e) {
              const message = e instanceof Error ? e.message : "Sign in failed";
              redirect(`/sign-in?error=${encodeURIComponent(message)}`);
            }
            redirect("/dashboard");
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

        <div className="mt-4 rounded-[14px] bg-page/80 p-3 text-sm text-muted">
          <p className="font-medium text-ink">Demo accounts</p>
          <p className="mt-1">trevor@together.app</p>
          <p>shonda@together.app</p>
        </div>

        <form
          action={async (formData) => {
            "use server";
            formData.set("mode", "magic");
            try {
              await signInAction(formData);
            } catch (e) {
              const message = e instanceof Error ? e.message : "Sign in failed";
              redirect(`/sign-in?error=${encodeURIComponent(message)}`);
            }
            redirect("/dashboard");
          }}
          className="mt-4 space-y-3 border-t border-border pt-4"
        >
          <p className="text-sm text-muted">Or continue as Shonda instantly:</p>
          <Input
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            defaultValue="shonda@together.app"
          />
          <Button type="submit" variant="secondary" className="w-full">
            Continue with magic link
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
