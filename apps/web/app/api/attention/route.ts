import { NextResponse } from "next/server";
import { db } from "@liberation-os/db";
import { authErrorResponse, requireUser } from "../../../lib/api-auth";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const user = await requireUser();
    const items = await db.contentItem.findMany({
      where: {
        project: { workspace: { userId: user.id } },
        OR: [
          { status: "draft" },
          { status: "approved" },
          { project: { status: "waiting_review" } },
        ],
      },
      include: {
        project: {
          select: { id: true, title: true, goalType: true, workspaceId: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({
      items,
      summary: {
        drafts: items.filter((item) => item.status === "draft").length,
        approved: items.filter((item) => item.status === "approved").length,
        total: items.length,
      },
    });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json(
        { error: "Unable to load attention queue" },
        { status: 500 },
      )
    );
  }
}
