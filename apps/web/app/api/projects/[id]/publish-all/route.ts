import { NextResponse } from "next/server";
import { db } from "@liberation-os/db";
import { publishContentItem } from "../../../_lib/publishing";
import {
  authErrorResponse,
  requireProjectAccess,
  requireUser,
} from "../../../../../lib/api-auth";

interface RouteProps {
  params: Promise<{ id: string }>;
}
export async function POST(_request: Request, { params }: RouteProps) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await requireProjectAccess(id, user.id);
    const approved = await db.contentItem.findMany({
      where: { projectId: id, status: "approved" },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    const results = [];
    for (const item of approved) {
      try {
        const result = await publishContentItem({ contentId: item.id });
        results.push({ contentId: item.id, ok: true, status: result.status });
      } catch (error) {
        console.error("Bulk publish item failed", {
          contentId: item.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        results.push({
          contentId: item.id,
          ok: false,
          error: "Publish failed",
        });
      }
    }
    return NextResponse.json({
      updated: results.filter((result) => result.ok).length,
      failed: results.filter((result) => !result.ok).length,
      results,
    });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json({ error: "Unable to publish content" }, { status: 500 })
    );
  }
}
