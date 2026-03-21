export interface BufferCredentials {
  accessToken: string;
}

export interface BufferScheduleInput {
  text: string;
  profileIds: string[];  // Buffer profile IDs to post to
  scheduledAt?: string; // ISO — if omitted, adds to queue
  mediaUrls?: string[];
}

export interface BufferScheduleResult {
  provider: "buffer";
  externalId: string;
  scheduledAt?: string;
  profileIds: string[];
}

/**
 * Schedule a social post via the Buffer API v1.
 */
export async function scheduleWithBuffer(
  input: BufferScheduleInput,
  credentials: BufferCredentials,
): Promise<BufferScheduleResult> {
  const base = "https://api.bufferapp.com/1";

  const body = new URLSearchParams({
    access_token: credentials.accessToken,
    text: input.text,
  });

  input.profileIds.forEach((id) => body.append("profile_ids[]", id));

  if (input.scheduledAt) {
    body.set(
      "scheduled_at",
      String(Math.floor(new Date(input.scheduledAt).getTime() / 1000)),
    );
  }

  if (input.mediaUrls?.length) {
    input.mediaUrls.forEach((url) => body.append("media[photo][]", url));
  }

  const res = await fetch(`${base}/updates/create.json`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Buffer API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as {
    updates: { id: string; scheduled_at?: number }[];
  };

  const first = data.updates[0];

  return {
    provider: "buffer",
    externalId: first?.id ?? "unknown",
    scheduledAt:
      first?.scheduled_at
        ? new Date(first.scheduled_at * 1000).toISOString()
        : input.scheduledAt,
    profileIds: input.profileIds,
  };
}
