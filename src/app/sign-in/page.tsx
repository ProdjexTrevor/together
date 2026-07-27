export const dynamic = "force-dynamic";

import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { signInAction } from "@/services/actions";
import { redirect } from "next/navigation";
import { getRepository } from "@/services";

function safeRedirectPath(next: string | undefined) {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/dashboard";
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const user = await getRepository().getSessionUser();
  if (user) {
    const ctx = await getRepository().getHouseholdContext();
    redirect(ctx ? safeRedirectPath(next) : "/onboarding");
  }

  const nextPath = safeRedirectPath(next);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 flex justify-center">
        <Logo href="/sign-in" />
      </div>
      <Card className="p-6">
        <h1 className="font-display text-3xl text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Enter your household email and password to continue.
        </p>
        {error ? (
          <p className="mt-3 rounded-[12px] bg-pale-clay px-3 py-2 text-sm text-clay">{error}</p>
        ) : null}

        <form
          action={async (formData) => {
            "use server";
            const destination = safeRedirectPath(String(formData.get("next") || ""));
            try {
              await signInAction(formData);
            } catch (e) {
              const message = e instanceof Error ? e.message : "Sign in failed";
              redirect(`/sign-in?error=${encodeURIComponent(message)}`);
            }
            redirect(destination);
          }}
          className="mt-6 space-y-4"
        >
          <input type="hidden" name="mode" value="password" />
          <input type="hidden" name="next" value={nextPath} />
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
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
              placeholder="Your password"
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
            const destination = safeRedirectPath(String(formData.get("next") || ""));
            try {
              await signInAction(formData);
            } catch (e) {
              const message = e instanceof Error ? e.message : "Sign in failed";
              redirect(`/sign-in?error=${encodeURIComponent(message)}`);
            }
            redirect(destination);
          }}
          className="mt-4 space-y-3 border-t border-border pt-4"
        >
          <input type="hidden" name="next" value={nextPath} />
          <p className="text-sm text-muted">Or continue with a magic link:</p>
          <Input
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            autoComplete="email"
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
