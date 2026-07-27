import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/crypto";

describe("encryptSecret / decryptSecret", () => {
  const previous = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  });

  afterEach(() => {
    if (previous === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = previous;
  });

  it("round-trips a note", () => {
    const cipher = encryptSecret("feeling worn thin today");
    expect(cipher).toMatch(/^enc:v1:/);
    expect(cipher).not.toContain("feeling");
    expect(decryptSecret(cipher)).toBe("feeling worn thin today");
  });

  it("passes through legacy plaintext", () => {
    expect(decryptSecret("old plaintext note")).toBe("old plaintext note");
  });

  it("returns null for empty notes", () => {
    expect(encryptSecret("  ")).toBeNull();
    expect(decryptSecret(null)).toBeNull();
  });
});
