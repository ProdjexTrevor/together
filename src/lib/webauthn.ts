import { cookies } from "next/headers";

const CHALLENGE_COOKIE = "together_webauthn_challenge";

export async function saveWebAuthnChallenge(challenge: string, userId: string) {
  const jar = await cookies();
  jar.set(
    CHALLENGE_COOKIE,
    JSON.stringify({ challenge, userId, at: Date.now() }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 5,
    }
  );
}

export async function readWebAuthnChallenge() {
  const jar = await cookies();
  const raw = jar.get(CHALLENGE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { challenge: string; userId: string; at: number };
    if (Date.now() - parsed.at > 5 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearWebAuthnChallenge() {
  const jar = await cookies();
  jar.delete(CHALLENGE_COOKIE);
}

export function rpFromRequest(request: Request) {
  const url = new URL(request.url);
  return {
    rpID: url.hostname,
    rpName: "Together",
    origin: url.origin,
  };
}
