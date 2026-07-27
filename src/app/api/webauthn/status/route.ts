import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRepository } from "@/services";

export const dynamic = "force-dynamic";

const UNLOCK_COOKIE = "together_device_unlocked";

/** Status for the device lock gate. */
export async function GET() {
  const repo = getRepository();
  const user = await repo.getSessionUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, lockEnabled: false, unlocked: false });
  }

  const creds = await repo.listWebAuthnCredentials(user.id);
  const jar = await cookies();
  const unlocked = jar.get(UNLOCK_COOKIE)?.value === user.id;

  return NextResponse.json({
    authenticated: true,
    lockEnabled: creds.length > 0,
    unlocked,
    credentialCount: creds.length,
  });
}

export async function DELETE() {
  const repo = getRepository();
  const user = await repo.getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await repo.clearWebAuthnCredentials(user.id);
  const jar = await cookies();
  jar.delete(UNLOCK_COOKIE);
  return NextResponse.json({ ok: true });
}
