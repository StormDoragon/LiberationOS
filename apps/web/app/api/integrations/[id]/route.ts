import { NextResponse } from "next/server";
import { db } from "@liberation-os/db";
import { authErrorResponse, requireUser } from "../../../../lib/api-auth";

interface RouteProps {
  params: Promise<{ id: string }>;
}
export async function DELETE(_request: Request, { params }: RouteProps) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const connection = await db.integrationConnection.findFirst({
      where: { id, workspace: { userId: user.id } },
      select: { id: true },
    });
    if (!connection)
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 },
      );
    await db.integrationConnection.delete({ where: { id: connection.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json(
        { error: "Unable to remove integration" },
        { status: 500 },
      )
    );
  }
}
