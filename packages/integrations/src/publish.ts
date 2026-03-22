/**
 * Central publish router — maps an IntegrationConnection to the right adapter
 * and returns a uniform PublishJobResult.
 *
 * Caller is responsible for:
 *  - Loading the IntegrationConnection from DB (including decrypted credentials)
 *  - Persisting the returned PublishJob to the DB
 */
import { postToTwitter } from "./twitter";
import { postToInstagram } from "./instagram";
import { sendMailchimpCampaign, sendConvertKitBroadcast } from "./email";
import { createShopifyProduct } from "./shopify";
import { publishToWordPress } from "./wordpress";
import { scheduleWithBuffer } from "./buffer";

export interface ContentPayload {
  id: string;
  type: string;
  title?: string | null;
  body: string;
  platform?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface PublishOptions {
  scheduledAt?: string; // ISO — if set, schedule instead of publish now
}

export interface PublishJobResult {
  provider: string;
  externalId: string;
  url?: string;
  scheduledAt?: string;
  raw?: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCredentials = Record<string, any>;

/**
 * Publish a ContentItem to a specific integration provider.
 *
 * @param content   - The ContentItem to publish (body/title/metadata)
 * @param provider  - Provider string (twitter | instagram | facebook | youtube | reddit | snapchat | mailchimp | convertkit | shopify | wordpress | buffer)
 * @param credentials - Decrypted credentials object from IntegrationConnection
 * @param options   - Optional scheduledAt ISO string
 */
export async function publishContent(
  content: ContentPayload,
  provider: string,
  credentials: AnyCredentials,
  options: PublishOptions = {},
): Promise<PublishJobResult> {
  const { scheduledAt } = options;

  switch (provider) {
    case "twitter": {
      const result = await postToTwitter(
        { text: content.body.slice(0, 280), scheduledAt },
        credentials as Parameters<typeof postToTwitter>[1],
      );
      return { ...result, url: result.url };
    }

    case "instagram": {
      const imageUrl =
        (content.metadata as { imageUrl?: string } | null)?.imageUrl ??
        undefined;
      const result = await postToInstagram(
        { caption: content.body, imageUrl, scheduledAt },
        credentials as Parameters<typeof postToInstagram>[1],
      );
      return { ...result, url: result.permalink };
    }

    case "mailchimp": {
      const result = await sendMailchimpCampaign(
        {
          subject: content.title ?? content.body.slice(0, 60),
          fromName:
            (credentials as { fromName?: string }).fromName ?? "LiberationOS",
          replyTo:
            (credentials as { replyTo?: string }).replyTo ??
            "hello@example.com",
          htmlBody: `<p>${content.body.replace(/\n/g, "<br>")}</p>`,
          scheduledAt,
        },
        credentials as Parameters<typeof sendMailchimpCampaign>[1],
      );
      return { ...result, url: result.archiveUrl };
    }

    case "convertkit": {
      const result = await sendConvertKitBroadcast(
        {
          subject: content.title ?? content.body.slice(0, 60),
          content: content.body,
          scheduledAt,
        },
        credentials as Parameters<typeof sendConvertKitBroadcast>[1],
      );
      return result;
    }

    case "shopify": {
      const result = await createShopifyProduct(
        {
          title: content.title ?? "New Product",
          bodyHtml: `<p>${content.body.replace(/\n/g, "<br>")}</p>`,
          status: "draft",
          tags:
            (content.metadata as { tags?: string[] } | null)?.tags ?? [],
        },
        credentials as Parameters<typeof createShopifyProduct>[1],
      );
      return { ...result, url: result.adminUrl };
    }

    case "wordpress": {
      const result = await publishToWordPress(
        {
          title: content.title ?? "New Post",
          content: content.body,
          status: scheduledAt ? "draft" : "publish",
        },
        credentials as Parameters<typeof publishToWordPress>[1],
      );
      return { ...result, url: result.url };
    }

    case "buffer": {
      const profileIds: string[] =
        (credentials as { profileIds?: string[] }).profileIds ?? [];
      const result = await scheduleWithBuffer(
        { text: content.body.slice(0, 500), profileIds, scheduledAt },
        credentials as Parameters<typeof scheduleWithBuffer>[1],
      );
      return result;
    }

    // These channels are routed through Buffer profiles for publishing.
    case "facebook":
    case "youtube":
    case "reddit":
    case "snapchat": {
      const profileIds: string[] =
        (credentials as { profileIds?: string[] }).profileIds ?? [];
      const result = await scheduleWithBuffer(
        { text: content.body.slice(0, 500), profileIds, scheduledAt },
        credentials as Parameters<typeof scheduleWithBuffer>[1],
      );
      return { ...result, provider };
    }

    default:
      throw new Error(`Unknown integration provider: "${provider}"`);
  }
}
