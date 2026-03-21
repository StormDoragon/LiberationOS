import { NextResponse } from "next/server";
import { db } from "@liberation-os/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await db.contentItem.findMany({
    where: {
      OR: [
        { status: "draft" },
        { status: "approved" },
        { project: { status: "waiting_review" } },
      ],
    },
    include: {
      project: { select: { id: true, title: true, goalType: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const summary = {
    drafts: items.filter((i) => i.status === "draft").length,
    approved: items.filter((i) => i.status === "approved").length,
    total: items.length,
  };

  return NextResponse.json({ items, summary });
}
