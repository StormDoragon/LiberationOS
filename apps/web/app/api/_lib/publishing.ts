import { db, decryptIntegrationCredentials, Prisma } from "@liberation-os/db";
import { publishContent } from "@liberation-os/integrations";

type PublishStatus = "published" | "scheduled";
type PublishJobRecord = Awaited<ReturnType<typeof db.publishJob.create>>;

export interface PublishContentItemInput {
  contentId: string;
  integrationId?: string;
  scheduledAt?: string;
}

export interface PublishContentItemResult {
  ok: true;
  status: PublishStatus;
  externalId?: string;
  job: PublishJobRecord;
}

export class PublishHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly job?: PublishJobRecord,
  ) {
    super(message);
    this.name = "PublishHttpError";
  }
}

function normalizeProvider(value: string | null | undefined): string | null {
  return value?.trim().toLowerCase().replace(/^x$/, "twitter") ?? null;
}

function toRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return (value ?? {}) as Record<string, unknown>;
}

function parseScheduledAt(value: string | undefined): Date | null {
  if (!value) return null;

  const scheduledFor = new Date(value);
  if (Number.isNaN(scheduledFor.getTime())) {
    throw new PublishHttpError("scheduledAt must be a valid ISO datetime", 400);
  }

  if (scheduledFor.getTime() < Date.now() - 60_000) {
    throw new PublishHttpError("scheduledAt must be in the future", 400);
  }

  return scheduledFor;
}

export async function publishContentItem({
  contentId,
  integrationId,
  scheduledAt,
}: PublishContentItemInput): Promise<PublishContentItemResult> {
  const scheduledFor = parseScheduledAt(scheduledAt);
  const item = await db.contentItem.findUnique({
    where: { id: contentId },
    include: { project: { select: { workspaceId: true } } },
  });

  if (!item) {
    throw new PublishHttpError("Content item not found", 404);
  }

  if (item.status !== "approved" && item.status !== "scheduled") {
    throw new PublishHttpError(
      "Only approved or scheduled content can be published",
      409,
    );
  }

  const platformProvider = normalizeProvider(item.platform);
  let connection = integrationId
    ? await db.integrationConnection.findUnique({
        where: { id: integrationId },
      })
    : null;

  if (!connection && !integrationId && platformProvider) {
    connection = await db.integrationConnection.findFirst({
      where: {
        workspaceId: item.project.workspaceId,
        provider: platformProvider,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  if (!connection && !integrationId) {
    connection = await db.integrationConnection.findFirst({
      where: { workspaceId: item.project.workspaceId },
      orderBy: { createdAt: "asc" },
    });
  }

  if (!connection) {
    throw new PublishHttpError(
      "No integration connection found for this content item",
      400,
    );
  }

  if (connection.workspaceId !== item.project.workspaceId) {
    throw new PublishHttpError(
      "Integration connection belongs to a different workspace",
      403,
    );
  }

  let externalId: string | undefined;
  let publishError: string | undefined;

  try {
    const result = await publishContent(
      {
        id: item.id,
        type: item.type,
        title: item.title,
        body: item.body,
        platform: item.platform,
        metadata: toRecord(item.metadata),
      },
      connection.provider,
      decryptIntegrationCredentials(connection),
      { scheduledAt: scheduledFor?.toISOString() },
    );
    externalId = result.externalId;
  } catch (err) {
    publishError = err instanceof Error ? err.message : String(err);
  }

  const newStatus: PublishStatus = scheduledFor ? "scheduled" : "published";

  const job = await db.publishJob.create({
    data: {
      contentItemId: contentId,
      integration: connection.provider,
      scheduledFor,
      status: publishError ? "failed" : newStatus,
      externalId: externalId ?? null,
    },
  });

  if (publishError) {
    throw new PublishHttpError(publishError, 502, job);
  }

  await db.contentItem.update({
    where: { id: contentId },
    data: { status: newStatus },
  });

  return { ok: true, status: newStatus, externalId, job };
}
