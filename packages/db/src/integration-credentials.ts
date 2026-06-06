import { decrypt, encrypt } from "@liberation-os/utils";
import type { Prisma } from "@prisma/client";

interface CredentialFields {
  encryptedCredentials: string | null;
  credentials: Prisma.JsonValue | null;
}

function asCredentialRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Integration credentials must be a JSON object");
  }
  return value as Record<string, unknown>;
}

export function encryptIntegrationCredentials(
  credentials: Record<string, unknown>,
): string {
  return encrypt(JSON.stringify(credentials));
}

export function decryptIntegrationCredentials(
  connection: CredentialFields,
): Record<string, unknown> {
  if (connection.encryptedCredentials) {
    try {
      return asCredentialRecord(
        JSON.parse(decrypt(connection.encryptedCredentials)),
      );
    } catch (error) {
      console.error("Unable to decrypt integration credentials", {
        error:
          error instanceof Error ? error.message : "Unknown decryption error",
      });
      throw new Error("Integration credentials could not be decrypted");
    }
  }

  if (connection.credentials) {
    return asCredentialRecord(connection.credentials);
  }

  throw new Error("Integration credentials are not configured");
}
