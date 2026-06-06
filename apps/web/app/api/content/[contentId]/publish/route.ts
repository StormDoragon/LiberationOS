import { NextRequest, NextResponse } from "next/server";
import { PublishHttpError, publishContentItem } from "../../../_lib/publishing";
import {
  authErrorResponse,
  requireContentAccess,
  requireUser,
} from "../../../../../lib/api-auth";
import { z } from "zod";

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
const publishSchema = z.object({
  integrationId: z.string().cuid().optional(),
  scheduledAt: z.string().datetime().optional(),
});

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    const user = await requireUser();
    const { contentId } = await params;
    await requireContentAccess(contentId, user.id);
    const parsed = publishSchema.safeParse(
      await request.json().catch(() => ({})),
    );
    if (!parsed.success)
      return NextResponse.json(
        { error: "Invalid publish input", issues: parsed.error.flatten() },
        { status: 400 },
      );
    const body = parsed.data;
    const result = await publishContentItem({
      contentId,
      integrationId: body.integrationId,
      scheduledAt: body.scheduledAt,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PublishHttpError) {
      return NextResponse.json(
        { error: error.message, job: error.job },
        { status: error.status },
      );
    }

    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Content publish failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Publish failed" }, { status: 502 });
  }
}
