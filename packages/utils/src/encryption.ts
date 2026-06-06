import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const configuredKey = process.env.ENCRYPTION_KEY;
  if (!configuredKey) {
    throw new Error(
      "ENCRYPTION_KEY is required to encrypt integration credentials",
    );
  }

  const key = /^[a-f\d]{64}$/i.test(configuredKey)
    ? Buffer.from(configuredKey, "hex")
    : Buffer.from(configuredKey, "base64");

  if (key.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be a 32-byte key encoded as 64 hex characters or base64",
    );
  }

  return key;
}

export function encrypt(text: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

export function decrypt(encrypted: string): string {
  const [version, encodedIv, encodedAuthTag, encodedCiphertext, ...extra] =
    encrypted.split(":");
  if (
    version !== VERSION ||
    !encodedIv ||
    !encodedAuthTag ||
    encodedCiphertext === undefined ||
    extra.length > 0
  ) {
    throw new Error("Encrypted credential payload has an invalid format");
  }

  const iv = Buffer.from(encodedIv, "base64url");
  const authTag = Buffer.from(encodedAuthTag, "base64url");
  const ciphertext = Buffer.from(encodedCiphertext, "base64url");
  if (iv.length !== IV_LENGTH || authTag.length !== 16) {
    throw new Error("Encrypted credential payload is malformed");
  }

  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
