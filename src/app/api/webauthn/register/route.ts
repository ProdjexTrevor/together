import { NextResponse } from "next/server";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { getRepository } from "@/services";
import {
  clearWebAuthnChallenge,
  rpFromRequest,
  saveWebAuthnChallenge,
} from "@/lib/webauthn";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const repo = getRepository();
  const user = await repo.getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rpID, rpName } = rpFromRequest(request);
  const existing = await repo.listWebAuthnCredentials(user.id);

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.email,
    userDisplayName: user.full_name,
    userID: new TextEncoder().encode(user.id),
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({
      id: c.credential_id,
      transports: c.transports as AuthenticatorTransport[],
    })),
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "preferred",
      userVerification: "required",
    },
  });

  await saveWebAuthnChallenge(options.challenge, user.id);
  return NextResponse.json(options);
}

export async function POST(request: Request) {
  const repo = getRepository();
  const user = await repo.getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const expected = await readChallengeFor(user.id);
  if (!expected) {
    return NextResponse.json({ error: "Challenge expired. Try again." }, { status: 400 });
  }

  const { rpID, origin } = rpFromRequest(request);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: expected.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 400 }
    );
  }

  await clearWebAuthnChallenge();

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Could not verify Face ID / passcode" }, { status: 400 });
  }

  const { credential, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo;

  await repo.saveWebAuthnCredential({
    credential_id: credential.id,
    public_key: Buffer.from(credential.publicKey).toString("base64url"),
    counter: credential.counter,
    transports: credential.transports ?? [],
    device_type: credentialDeviceType,
    backed_up: credentialBackedUp,
  });

  const { cookies } = await import("next/headers");
  const jar = await cookies();
  jar.set("together_device_unlocked", user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return NextResponse.json({ ok: true });
}

async function readChallengeFor(userId: string) {
  const { readWebAuthnChallenge } = await import("@/lib/webauthn");
  const challenge = await readWebAuthnChallenge();
  if (!challenge || challenge.userId !== userId) return null;
  return challenge;
}

type AuthenticatorTransport = "internal" | "hybrid" | "usb" | "nfc" | "ble";
