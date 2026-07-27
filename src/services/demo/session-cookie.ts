import { cookies } from "next/headers";

export const DEMO_SESSION_COOKIE = "together_demo_session";

export async function readDemoSessionUserId(): Promise<string | null> {
  try {
    const jar = await cookies();
    return jar.get(DEMO_SESSION_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

export async function writeDemoSessionUserId(userId: string) {
  try {
    const jar = await cookies();
    jar.set(DEMO_SESSION_COOKIE, userId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  } catch {
    // Outside a Next.js request (unit tests) — memory session still applies.
  }
}

export async function clearDemoSessionUserId() {
  try {
    const jar = await cookies();
    jar.delete(DEMO_SESSION_COOKIE);
  } catch {
    // no-op outside request context
  }
}
