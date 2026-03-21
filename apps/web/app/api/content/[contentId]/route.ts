import { NextRequest, NextResponse } from "next/server";
import { db } from "@liberation-os/db";

interface RouteProps {
  params: Promise<{ contentId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  const { contentId } = await params;
  const body = await request.json();
  const newStatus = body.status;

  const validStatuses = ["draft", "approved", "scheduled", "published"];
  if (!validStatuses.includes(newStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const item = await db.contentItem.update({
    where: { id: contentId },
    data: { status: newStatus },
  });

  return NextResponse.json({ item });
}
