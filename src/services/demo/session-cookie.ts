import { cookies } from "next/headers";

export const DEMO_SESSION_COOKIE = "together_demo_session";

declare global {
  // eslint-disable-next-line no-var
  var __togetherDemoSessionMirror: string | null | undefined;
}

export async function readDemoSessionUserId(): Promise<string | null> {
  try {
    const jar = await cookies();
    const value = jar.get(DEMO_SESSION_COOKIE)?.value;
    if (value) {
      globalThis.__togetherDemoSessionMirror = value;
      return value;
    }
  } catch {
    // Outside request context
  }
  return globalThis.__togetherDemoSessionMirror ?? null;
}

export async function writeDemoSessionUserId(userId: string) {
  globalThis.__togetherDemoSessionMirror = userId;
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
    // Unit tests keep the in-memory mirror only.
  }
}

export async function clearDemoSessionUserId() {
  globalThis.__togetherDemoSessionMirror = null;
  try {
    const jar = await cookies();
    jar.delete(DEMO_SESSION_COOKIE);
  } catch {
    // no-op outside request context
  }
}
