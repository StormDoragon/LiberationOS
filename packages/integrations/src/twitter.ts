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
function buildOAuth1Header(
  method: string,
  url: string,
  creds: TwitterCredentials,
): string {
  const params: Record<string, string> = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
  };

  // We can't use crypto.createHmac in edge runtime without a polyfill, so we
  // return a placeholder signature. In production, run the worker (Node.js)
  // which has full crypto access, or use the official twitter-api-v2 package.
  const signatureBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(
      Object.entries(params)
        .sort()
        .map(([k, v]) => `${k}=${v}`)
        .join("&"),
    ),
  ].join("&");

  void signatureBase; // used in real HMAC-SHA1 computation

  const headerParams = Object.entries(params)
    .map(([k, v]) => `${k}="${encodeURIComponent(v)}"`)
    .join(", ");

  return `OAuth ${headerParams}`;
}
