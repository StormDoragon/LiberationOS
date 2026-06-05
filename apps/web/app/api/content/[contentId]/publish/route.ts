import { NextRequest, NextResponse } from "next/server";
import { publishContentItem } from "../../../_lib/publishing";

interface RouteProps {
  params: Promise<{ contentId: string }>;
}

/**
 * POST /api/content/[contentId]/publish
 *
 * Body: { integrationId?: string; scheduledAt?: string }
 *
 * If integrationId is omitted, the route selects the workspace integration that
 * matches the content platform, then falls back to the oldest workspace
 * integration. Publishing failures are logged as failed PublishJob rows.
 */
export async function POST(request: NextRequest, { params }: RouteProps) {
  const { contentId } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    integrationId?: string;
    scheduledAt?: string;
  };

  try {
    const result = await publishContentItem({
      contentId,
      integrationId: body.integrationId,
      scheduledAt: body.scheduledAt,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish failed";
    const status = message.includes("not found") ? 404 : message.includes("No integration") ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
