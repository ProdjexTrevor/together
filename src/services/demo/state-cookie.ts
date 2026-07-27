import { gzipSync, gunzipSync } from "zlib";
import { cookies } from "next/headers";
import type { DemoState } from "./seed";

const COOKIE_PREFIX = "together_demo_s";
const COOKIE_COUNT = "together_demo_n";
const CHUNK_SIZE = 3000;

declare global {
  // eslint-disable-next-line no-var
  var __togetherDemoCookieMirror: string | undefined;
}

function encodeState(state: DemoState): string {
  const payload = { ...state, sessionUserId: null };
  return gzipSync(JSON.stringify(payload)).toString("base64");
}

function decodeState(encoded: string): DemoState | null {
  try {
    const json = gunzipSync(Buffer.from(encoded, "base64")).toString("utf8");
    return JSON.parse(json) as DemoState;
  } catch {
    return null;
  }
}

function chunk(value: string): string[] {
  const parts: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    parts.push(value.slice(i, i + CHUNK_SIZE));
  }
  return parts.length ? parts : [""];
}

export async function readDemoStateCookie(): Promise<DemoState | null> {
  try {
    const jar = await cookies();
    const countRaw = jar.get(COOKIE_COUNT)?.value;
    if (countRaw) {
      const count = Number(countRaw);
      if (Number.isFinite(count) && count > 0) {
        let encoded = "";
        for (let i = 0; i < count; i += 1) {
          encoded += jar.get(`${COOKIE_PREFIX}${i}`)?.value ?? "";
        }
        const parsed = decodeState(encoded);
        if (parsed) return parsed;
      }
    }
  } catch {
    // Outside request context
  }

  if (globalThis.__togetherDemoCookieMirror) {
    return decodeState(globalThis.__togetherDemoCookieMirror);
  }
  return null;
}

export async function writeDemoStateCookie(state: DemoState) {
  const encoded = encodeState(state);
  globalThis.__togetherDemoCookieMirror = encoded;
  const parts = chunk(encoded);

  try {
    const jar = await cookies();
    const previous = Number(jar.get(COOKIE_COUNT)?.value ?? "0");
    jar.set(COOKIE_COUNT, String(parts.length), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    parts.forEach((part, index) => {
      jar.set(`${COOKIE_PREFIX}${index}`, part, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    });
    for (let i = parts.length; i < previous; i += 1) {
      jar.delete(`${COOKIE_PREFIX}${i}`);
    }
  } catch {
    // Unit tests / non-request contexts keep the in-memory mirror only.
  }
}

export async function clearDemoStateCookie() {
  globalThis.__togetherDemoCookieMirror = undefined;
  try {
    const jar = await cookies();
    const previous = Number(jar.get(COOKIE_COUNT)?.value ?? "0");
    jar.delete(COOKIE_COUNT);
    for (let i = 0; i < Math.max(previous, 8); i += 1) {
      jar.delete(`${COOKIE_PREFIX}${i}`);
    }
  } catch {
    // no-op
  }
}
