import { NextResponse } from "next/server";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { getRepository } from "@/services";
import {
  clearWebAuthnChallenge,
  readWebAuthnChallenge,
  rpFromRequest,
  saveWebAuthnChallenge,
} from "@/lib/webauthn";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const UNLOCK_COOKIE = "together_device_unlocked";

export async function GET(request: Request) {
  const repo = getRepository();
  const user = await repo.getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const creds = await repo.listWebAuthnCredentials(user.id);
  if (!creds.length) {
    return NextResponse.json(
      { error: "Face ID / passcode is not set up yet. Enable it in Settings." },
      { status: 400 }
    );
  }

  const { rpID } = rpFromRequest(request);
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: creds.map((c) => ({
      id: c.credential_id,
      transports: c.transports as AuthenticatorTransport[],
    })),
  });

  await saveWebAuthnChallenge(options.challenge, user.id);
  return NextResponse.json(options);
}

export async function POST(request: Request) {
  const repo = getRepository();
  const user = await repo.getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const expected = await readWebAuthnChallenge();
  if (!expected || expected.userId !== user.id) {
    return NextResponse.json({ error: "Challenge expired. Try again." }, { status: 400 });
  }

  const creds = await repo.listWebAuthnCredentials(user.id);
  const dbCred = creds.find((c) => c.credential_id === body.id);
  if (!dbCred) {
    return NextResponse.json({ error: "Unknown authenticator" }, { status: 400 });
  }

  const { rpID, origin } = rpFromRequest(request);

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: expected.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: dbCred.credential_id,
        publicKey: Buffer.from(dbCred.public_key, "base64url"),
        counter: dbCred.counter,
        transports: dbCred.transports as AuthenticatorTransport[],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unlock failed" },
      { status: 400 }
    );
  }

  await clearWebAuthnChallenge();

  if (!verification.verified) {
    return NextResponse.json({ error: "Could not verify Face ID / passcode" }, { status: 400 });
  }

  await repo.updateWebAuthnCounter(
    dbCred.credential_id,
    verification.authenticationInfo.newCounter
  );

  const jar = await cookies();
  jar.set(UNLOCK_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(UNLOCK_COOKIE);
  return NextResponse.json({ ok: true });
}

type AuthenticatorTransport = "internal" | "hybrid" | "usb" | "nfc" | "ble";
