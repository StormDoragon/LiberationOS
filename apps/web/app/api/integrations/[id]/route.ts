import { NextRequest, NextResponse } from "next/server";
import { db } from "@liberation-os/db";

/**
 * DELETE /api/integrations/[id]
 * Removes an IntegrationConnection.
 */

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteProps,
) {
  const { id } = await params;

  await db.integrationConnection.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
