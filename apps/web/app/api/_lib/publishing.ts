import { db, Prisma } from "@liberation-os/db";
import { publishContent } from "@liberation-os/integrations";

type PublishStatus = "published" | "scheduled";

export interface PublishContentItemInput {
  contentId: string;
  integrationId?: string;
  scheduledAt?: string;
}

export interface PublishContentItemResult {
  ok: true;
  status: PublishStatus;
  externalId?: string;
  job: Awaited<ReturnType<typeof db.publishJob.create>>;
}

function normalizeProvider(value: string | null | undefined): string | null {
  return value?.trim().toLowerCase().replace(/^x$/, "twitter") ?? null;
}

function toRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return (value ?? {}) as Record<string, unknown>;
}

export async function publishContentItem({
  contentId,
  integrationId,
  scheduledAt,
}: PublishContentItemInput): Promise<PublishContentItemResult> {
  const item = await db.contentItem.findUnique({
    where: { id: contentId },
    include: { project: { select: { workspaceId: true } } },
  });

  if (!item) {
    throw new Error("Content item not found");
  }

  const platformProvider = normalizeProvider(item.platform);
  let connection = integrationId
    ? await db.integrationConnection.findUnique({ where: { id: integrationId } })
    : null;

  if (!connection && !integrationId && platformProvider) {
    connection = await db.integrationConnection.findFirst({
      where: { workspaceId: item.project.workspaceId, provider: platformProvider },
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
    throw new Error("No integration connection found for this content item");
  }

  if (connection.workspaceId !== item.project.workspaceId) {
    throw new Error("Integration connection belongs to a different workspace");
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
      toRecord(connection.credentials),
      { scheduledAt },
    );
    externalId = result.externalId;
  } catch (err) {
    publishError = err instanceof Error ? err.message : String(err);
  }

  const newStatus: PublishStatus = scheduledAt ? "scheduled" : "published";

  const job = await db.publishJob.create({
    data: {
      contentItemId: contentId,
      integration: connection.provider,
      scheduledFor: scheduledAt ? new Date(scheduledAt) : null,
      status: publishError ? "failed" : newStatus,
      externalId: externalId ?? null,
    },
  });

  if (publishError) {
    throw new Error(publishError);
  }

  await db.contentItem.update({
    where: { id: contentId },
    data: { status: newStatus },
  });

  return { ok: true, status: newStatus, externalId, job };
}
