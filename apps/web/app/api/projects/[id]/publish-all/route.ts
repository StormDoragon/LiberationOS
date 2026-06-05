import { NextResponse } from "next/server";
import { db } from "@liberation-os/db";
import { publishContentItem } from "../../../_lib/publishing";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteProps) {
  const { id } = await params;

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
      results.push({
        contentId: item.id,
        ok: false,
        error: error instanceof Error ? error.message : "Publish failed",
      });
    }
  }

  return NextResponse.json({
    updated: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    results,
  });
}
