export interface MailchimpCredentials {
  apiKey: string;   // ends with -us1, -us2 etc. — datacenter is parsed from it
  listId: string;   // Audience / List ID to add campaign to
}

export interface MailchimpCampaignInput {
  subject: string;
  previewText?: string;
  fromName: string;
  replyTo: string;
  htmlBody: string;
  scheduledAt?: string; // ISO — if provided, schedules instead of sending now
}

export interface MailchimpCampaignResult {
  provider: "mailchimp";
  externalId: string;        // campaign ID
  webId?: number;
  archiveUrl?: string;
  scheduledAt?: string;
}

/**
 * Create and send (or schedule) a Mailchimp email campaign.
 *
 * Flow: create campaign → set content → send/schedule
 */
export async function sendMailchimpCampaign(
  input: MailchimpCampaignInput,
  credentials: MailchimpCredentials,
): Promise<MailchimpCampaignResult> {
  const dc = credentials.apiKey.split("-").pop() ?? "us1";
  const base = `https://${dc}.api.mailchimp.com/3.0`;
  const auth = `Basic ${btoa(`anystring:${credentials.apiKey}`)}`;

  // 1. Create campaign
  const createRes = await fetch(`${base}/campaigns`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "regular",
      recipients: { list_id: credentials.listId },
      settings: {
        subject_line: input.subject,
        preview_text: input.previewText ?? "",
        from_name: input.fromName,
        reply_to: input.replyTo,
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Mailchimp create error ${createRes.status}: ${err}`);
  }

  const campaign = (await createRes.json()) as {
    id: string;
    web_id: number;
    archive_url: string;
  };

  // 2. Set HTML content
  const contentRes = await fetch(`${base}/campaigns/${campaign.id}/content`, {
    method: "PUT",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ html: input.htmlBody }),
  });

  if (!contentRes.ok) {
    const err = await contentRes.text();
    throw new Error(`Mailchimp content error ${contentRes.status}: ${err}`);
  }

  // 3. Send or schedule
  if (input.scheduledAt) {
    const scheduleRes = await fetch(
      `${base}/campaigns/${campaign.id}/actions/schedule`,
      {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify({ schedule_time: input.scheduledAt }),
      },
    );
    if (!scheduleRes.ok) {
      const err = await scheduleRes.text();
      throw new Error(`Mailchimp schedule error ${scheduleRes.status}: ${err}`);
    }
    return {
      provider: "mailchimp",
      externalId: campaign.id,
      webId: campaign.web_id,
      archiveUrl: campaign.archive_url,
      scheduledAt: input.scheduledAt,
    };
  }

  const sendRes = await fetch(`${base}/campaigns/${campaign.id}/actions/send`, {
    method: "POST",
    headers: { Authorization: auth },
  });

  if (!sendRes.ok) {
    const err = await sendRes.text();
    throw new Error(`Mailchimp send error ${sendRes.status}: ${err}`);
  }

  return {
    provider: "mailchimp",
    externalId: campaign.id,
    webId: campaign.web_id,
    archiveUrl: campaign.archive_url,
  };
}

// ---------------------------------------------------------------------------
// ConvertKit integration
// ---------------------------------------------------------------------------
export interface ConvertKitCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface ConvertKitBroadcastInput {
  subject: string;
  content: string;           // plain text or HTML
  description?: string;
  scheduledAt?: string;      // ISO
}

export interface ConvertKitBroadcastResult {
  provider: "convertkit";
  externalId: string;
  scheduledAt?: string;
}

/**
 * Create and send (or schedule) a ConvertKit broadcast email.
 */
export async function sendConvertKitBroadcast(
  input: ConvertKitBroadcastInput,
  credentials: ConvertKitCredentials,
): Promise<ConvertKitBroadcastResult> {
  const base = "https://api.convertkit.com/v3";

  const body: Record<string, unknown> = {
    api_secret: credentials.apiSecret,
    subject: input.subject,
    content: input.content,
    description: input.description ?? input.subject,
    public: true,
  };

  if (input.scheduledAt) {
    body.send_at = input.scheduledAt;
  }

  const res = await fetch(`${base}/broadcasts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ConvertKit error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { broadcast: { id: number } };

  return {
    provider: "convertkit",
    externalId: String(data.broadcast.id),
    scheduledAt: input.scheduledAt,
  };
}
