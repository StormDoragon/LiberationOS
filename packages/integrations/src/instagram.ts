export interface MetaCredentials {
  accessToken: string;       // long-lived page/user access token
  instagramAccountId: string; // Instagram Business Account ID
}

export interface InstagramPostInput {
  caption: string;
  imageUrl?: string;         // required for image posts; omit for text-only reels
  videoUrl?: string;
  scheduledAt?: string;      // ISO datetime — triggers scheduled publish
}

export interface InstagramPostResult {
  provider: "instagram";
  externalId: string;
  permalink?: string;
  scheduledAt?: string;
}

/**
 * Publish or schedule an Instagram post via Meta Graph API.
 *
 * Flow:
 * 1. Create a media container (POST /{ig-user-id}/media)
 * 2. Publish the container  (POST /{ig-user-id}/media_publish)
 *    — or schedule it for later by storing the containerId in PublishJob.metadata
 *      and calling media_publish at the right time.
 */
export async function postToInstagram(
  input: InstagramPostInput,
  credentials: MetaCredentials,
): Promise<InstagramPostResult> {
  const { accessToken, instagramAccountId } = credentials;
  const base = `https://graph.facebook.com/v19.0/${instagramAccountId}`;

  // Step 1 — create container
  const containerBody: Record<string, string> = {
    caption: input.caption,
    access_token: accessToken,
  };
  if (input.imageUrl) {
    containerBody.image_url = input.imageUrl;
  } else if (input.videoUrl) {
    containerBody.video_url = input.videoUrl;
    containerBody.media_type = "REELS";
  } else {
    // text-only carousel placeholder — requires at least one media item in prod
    containerBody.is_carousel_item = "false";
  }

  const containerRes = await fetch(`${base}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(containerBody),
  });

  if (!containerRes.ok) {
    const err = await containerRes.text();
    throw new Error(`Instagram container error ${containerRes.status}: ${err}`);
  }

  const { id: creationId } = (await containerRes.json()) as { id: string };

  // If scheduled, store container ID — caller handles actual publish_media call
  if (input.scheduledAt) {
    return {
      provider: "instagram",
      externalId: creationId,
      scheduledAt: input.scheduledAt,
    };
  }

  // Step 2 — publish immediately
  const publishRes = await fetch(`${base}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: creationId, access_token: accessToken }),
  });

  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`Instagram publish error ${publishRes.status}: ${err}`);
  }

  const { id: mediaId } = (await publishRes.json()) as { id: string };

  return {
    provider: "instagram",
    externalId: mediaId,
    permalink: `https://www.instagram.com/p/${mediaId}/`,
  };
}
