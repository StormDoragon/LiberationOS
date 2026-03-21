import { NextResponse } from "next/server";
import { db } from "@liberation-os/db";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteProps) {
  const { id } = await params;

  const result = await db.contentItem.updateMany({
    where: { projectId: id, status: "approved" },
    data: { status: "published" },
  });

  return NextResponse.json({ updated: result.count });
}
