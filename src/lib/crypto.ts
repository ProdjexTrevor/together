import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const PREFIX = "enc:v1:";

function getKey(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY?.trim();
  if (!raw) return null;

  // Prefer 64-char hex (32 bytes). Also accept any string hashed to 32 bytes.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  return createHash("sha256").update(raw).digest();
}

/** Encrypt a sensitive string for DB storage. Returns null for empty input. */
export function encryptSecret(plaintext: string | null | undefined): string | null {
  const value = plaintext?.trim();
  if (!value) return null;

  const key = getKey();
  if (!key) {
    // Fail closed in production so notes are never stored plaintext by accident.
    if (process.env.NODE_ENV === "production" && process.env.USE_MYSQL === "true") {
      throw new Error("ENCRYPTION_KEY is required to store private check-in notes");
    }
    return value;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

/** Decrypt a value previously written with encryptSecret. Passes through legacy plaintext. */
export function decryptSecret(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith(PREFIX)) return stored;

  const key = getKey();
  if (!key) {
    return null;
  }

  try {
    const payload = stored.slice(PREFIX.length);
    const [ivB64, tagB64, dataB64] = payload.split(".");
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const iv = Buffer.from(ivB64, "base64url");
    const tag = Buffer.from(tagB64, "base64url");
    const data = Buffer.from(dataB64, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export function encryptionConfigured() {
  return Boolean(getKey());
}
