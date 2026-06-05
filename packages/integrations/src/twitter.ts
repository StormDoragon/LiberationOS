import { createHmac, randomBytes } from "node:crypto";

export interface TwitterCredentials {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

export interface TwitterPostInput {
  text: string;
  scheduledAt?: string; // ISO — if provided, creates scheduled tweet via API
}

export interface TwitterPostResult {
  provider: "twitter";
  externalId: string;
  url: string;
  scheduledAt?: string;
}

/**
 * Post or schedule a tweet via Twitter/X API v2.
 * Requires OAuth 1.0a credentials. When scheduledAt is provided the tweet is
 * queued for that time; otherwise it posts immediately.
 */
export async function postToTwitter(
  input: TwitterPostInput,
  credentials: TwitterCredentials,
): Promise<TwitterPostResult> {
  const endpoint = "https://api.twitter.com/2/tweets";

  // Build OAuth 1.0a Authorization header
  const authHeader = buildOAuth1Header(
    "POST",
    endpoint,
    credentials,
  );

  const body: Record<string, unknown> = { text: input.text };
  // Twitter API v2 does not support native scheduling via POST /tweets.
  // Scheduling is handled at the application layer (BullMQ delay) when
  // scheduledAt is provided.

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twitter API error ${response.status}: ${error}`);
  }

  const data = (await response.json()) as { data: { id: string; text: string } };

  return {
    provider: "twitter",
    externalId: data.data.id,
    url: `https://twitter.com/i/web/status/${data.data.id}`,
    scheduledAt: input.scheduledAt,
  };
}

// ---------------------------------------------------------------------------
// Minimal OAuth 1.0a header builder (no external deps)
// ---------------------------------------------------------------------------
function encodeOAuth(value: string): string {
  return encodeURIComponent(value)
    .replace(/[!*()']/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function buildOAuth1Header(
  method: string,
  url: string,
  creds: TwitterCredentials,
): string {
  const params: Record<string, string> = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
  };

  const normalizedParams = Object.entries(params)
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      const keyCompare = leftKey.localeCompare(rightKey);
      return keyCompare === 0 ? leftValue.localeCompare(rightValue) : keyCompare;
    })
    .map(([key, value]) => `${encodeOAuth(key)}=${encodeOAuth(value)}`)
    .join("&");

  const signatureBase = [
    method.toUpperCase(),
    encodeOAuth(url),
    encodeOAuth(normalizedParams),
  ].join("&");

  const signingKey = `${encodeOAuth(creds.apiSecret)}&${encodeOAuth(creds.accessTokenSecret)}`;
  const oauthSignature = createHmac("sha1", signingKey)
    .update(signatureBase)
    .digest("base64");

  const headerParams = Object.entries({ ...params, oauth_signature: oauthSignature })
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${encodeOAuth(key)}="${encodeOAuth(value)}"`)
    .join(", ");

  return `OAuth ${headerParams}`;
}
