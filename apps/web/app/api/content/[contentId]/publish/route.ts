import { NextRequest, NextResponse } from "next/server";
import { db } from "@liberation-os/db";
import { publishContent } from "@liberation-os/integrations";

interface RouteProps {
  params: Promise<{ contentId: string }>;
}

/**
 * POST /api/content/[contentId]/publish
 *
 * Body: { integrationId: string; scheduledAt?: string }
 *
 * 1. Loads the ContentItem and IntegrationConnection from DB
 * 2. Calls the real integration adapter
 * 3. Creates a PublishJob record
 * 4. Updates ContentItem status to "published" (or "scheduled")
 */
export async function POST(request: NextRequest, { params }: RouteProps) {
  const { contentId } = await params;

  const body = (await request.json()) as {
    integrationId: string;
    scheduledAt?: string;
  };

  if (!body.integrationId) {
    return NextResponse.json(
      { error: "integrationId is required" },
      { status: 400 },
    );
  }

  // Load content item
  const item = await db.contentItem.findUnique({ where: { id: contentId } });
  if (!item) {
    return NextResponse.json({ error: "Content item not found" }, { status: 404 });
  }

  // Load integration connection
  const connection = await db.integrationConnection.findUnique({
    where: { id: body.integrationId },
  });
  if (!connection) {
    return NextResponse.json(
      { error: "Integration connection not found" },
      { status: 404 },
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
        metadata: item.metadata as Record<string, unknown> | null,
      },
      connection.provider,
      connection.credentials as Record<string, unknown>,
      { scheduledAt: body.scheduledAt },
    );
    externalId = result.externalId;
  } catch (err) {
    publishError = err instanceof Error ? err.message : String(err);
  }

  const newStatus = publishError
    ? item.status // keep current status on error
    : body.scheduledAt
      ? "scheduled"
      : "published";

  // Create PublishJob log (always, even on error)
  const job = await db.publishJob.create({
    data: {
      contentItemId: contentId,
      integration: connection.provider,
      scheduledFor: body.scheduledAt ? new Date(body.scheduledAt) : null,
      status: publishError ? "failed" : newStatus,
      externalId: externalId ?? null,
    },
  });

  if (!publishError) {
    await db.contentItem.update({
      where: { id: contentId },
      data: { status: newStatus },
    });
  }

  if (publishError) {
    return NextResponse.json(
      { error: publishError, job },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, status: newStatus, externalId, job });
}
