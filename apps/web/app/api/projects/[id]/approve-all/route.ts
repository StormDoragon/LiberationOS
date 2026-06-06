import { NextResponse } from "next/server";
import { db } from "@liberation-os/db";
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
    const result = await db.contentItem.updateMany({
      where: { projectId: id, status: "draft" },
      data: { status: "approved" },
    });
    return NextResponse.json({ updated: result.count });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json({ error: "Unable to approve content" }, { status: 500 })
    );
  }
}
