import { redirect } from "next/navigation";
import { isBasecampUnlocked } from "@/lib/basecamp-auth";
import { requireHousehold } from "@/lib/session";
import { BasecampPasscodeGate } from "@/components/basecamp/passcode-gate";
import { BasecampShell } from "@/components/basecamp/shell";
import { basecampService } from "@/services/basecamp/service";

export const dynamic = "force-dynamic";

export default async function BasecampLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ctx } = await requireHousehold();
  const unlocked = await isBasecampUnlocked();
  if (!unlocked) {
    return <BasecampPasscodeGate />;
  }
  await basecampService.bootstrap();
  return <BasecampShell partnerName={ctx.partner?.full_name}>{children}</BasecampShell>;
}
