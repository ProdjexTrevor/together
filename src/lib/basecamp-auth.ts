import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const BASECAMP_COOKIE = "together_basecamp_ok";
const DEFAULT_CODE = "12162006";

function expectedCode() {
  return (process.env.BASECAMP_PASSCODE || DEFAULT_CODE).trim();
}

export function verifyBasecampPasscode(input: string) {
  const a = createHash("sha256").update(String(input || "").trim()).digest();
  const b = createHash("sha256").update(expectedCode()).digest();
  return timingSafeEqual(a, b);
}

export async function isBasecampUnlocked() {
  try {
    const jar = await cookies();
    return jar.get(BASECAMP_COOKIE)?.value === "1";
  } catch {
    return false;
  }
}

export async function unlockBasecamp() {
  const jar = await cookies();
  jar.set(BASECAMP_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function lockBasecamp() {
  const jar = await cookies();
  jar.delete(BASECAMP_COOKIE);
}
