import { notFound, redirect } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { acceptInviteAction } from "@/services/actions";
import { getRepository } from "@/services";
import { Button } from "@/components/ui/button";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { token } = await params;
  const { created } = await searchParams;
  const invitation = await getRepository().getInvitation(token);
  if (!invitation && !created) notFound();

  if (created) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
        <Logo className="mb-8 justify-center" />
        <Card className="p-6">
          <h1 className="font-display text-3xl text-ink">Invitation ready</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Share this single-use link with your partner. It expires in 7 days.
          </p>
          <code className="mt-4 block break-all rounded-[12px] bg-page p-3 text-sm">
            /invite/{token}
          </code>
          <a
            href="/dashboard"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-[14px] bg-clay text-base font-medium text-white"
          >
            Go to dashboard
          </a>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <Logo className="mb-8 justify-center" />
      <Card className="p-6">
        <h1 className="font-display text-3xl text-ink">Join your household</h1>
        <p className="mt-2 text-sm text-muted">
          You&apos;ve been invited to share plans with your partner.
        </p>
        <form
          action={async (formData) => {
            "use server";
            await acceptInviteAction(token, formData);
            redirect("/dashboard");
          }}
          className="mt-6 space-y-4"
        >
          <div>
            <Label htmlFor="full_name">Your name</Label>
            <Input id="full_name" name="full_name" required />
          </div>
          <p className="text-sm text-muted">Invited as {invitation!.email}</p>
          <Button type="submit" className="w-full" size="lg">
            Accept invitation
          </Button>
        </form>
      </Card>
    </div>
  );
}
