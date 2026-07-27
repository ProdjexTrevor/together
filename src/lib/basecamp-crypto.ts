/** Force encrypt for Basecamp — never store spicy plaintext when a key exists. */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "enc:v1:";

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY?.trim();
  if (raw && /^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  if (raw) return createHash("sha256").update(raw).digest();
  // Deterministic fallback for demo-only so Basecamp still obfuscates at rest in cookies.
  // Production MySQL must set ENCRYPTION_KEY.
  return createHash("sha256").update("together-basecamp-demo-key").digest();
}

export function sealBasecamp(plaintext: string | null | undefined): string {
  const value = (plaintext ?? "").trim();
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value || " ", "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function openBasecamp(stored: string | null | undefined): string {
  if (!stored) return "";
  if (!stored.startsWith(PREFIX)) return stored;
  try {
    const payload = stored.slice(PREFIX.length);
    const [ivB64, tagB64, dataB64] = payload.split(".");
    if (!ivB64 || !tagB64 || !dataB64) return "";
    const key = getKey();
    const iv = Buffer.from(ivB64, "base64url");
    const tag = Buffer.from(tagB64, "base64url");
    const data = Buffer.from(dataB64, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    return out === " " ? "" : out;
  } catch {
    return "";
  }
}
