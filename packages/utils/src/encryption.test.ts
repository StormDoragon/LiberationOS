import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decrypt, encrypt } from "./encryption";

const validKey = "0123456789abcdef".repeat(4);

describe("credential encryption", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = validKey;
  });
  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  it("round-trips text in a versioned authenticated payload", () => {
    const encrypted = encrypt("super-secret");
    expect(encrypted).toMatch(/^v1:[^:]+:[^:]+:[^:]+$/);
    expect(decrypt(encrypted)).toBe("super-secret");
  });

  it("uses a unique IV for repeated values", () => {
    expect(encrypt("same value")).not.toBe(encrypt("same value"));
  });

  it("rejects unsupported versions and malformed payloads", () => {
    expect(() => decrypt("v2:a:b:c")).toThrow("invalid format");
    expect(() => decrypt("v1:short:tag:value")).toThrow("malformed");
  });

  it("detects ciphertext tampering", () => {
    const parts = encrypt("protected").split(":");
    const ciphertext = parts[3] ?? "";
    parts[3] = `${ciphertext[0] === "A" ? "B" : "A"}${ciphertext.slice(1)}`;
    expect(() => decrypt(parts.join(":"))).toThrow();
  });

  it("accepts base64-encoded 32-byte keys", () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    expect(decrypt(encrypt("base64 secret"))).toBe("base64 secret");
  });

  it("requires a valid 32-byte key", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt("secret")).toThrow("ENCRYPTION_KEY is required");
    process.env.ENCRYPTION_KEY = "too-short";
    expect(() => encrypt("secret")).toThrow("32-byte key");
  });
});
