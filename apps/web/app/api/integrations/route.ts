import { NextRequest, NextResponse } from "next/server";
import { db, encryptIntegrationCredentials } from "@liberation-os/db";
import { z } from "zod";
import {
  authErrorResponse,
  requireUser,
  requireWorkspaceAccess,
} from "../../../lib/api-auth";

const integrationSchema = z.object({
  workspaceId: z.string().cuid(),
  provider: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .transform((value) => value.toLowerCase()),
  credentials: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional(),
});

function scrubCredentials<
  T extends { credentials: unknown; encryptedCredentials: unknown },
>(connection: T) {
  const {
    credentials: _legacy,
    encryptedCredentials: _encrypted,
    ...safe
  } = connection;
  return { ...safe, connected: true };
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const workspaceId = request.nextUrl.searchParams.get("workspaceId");
    if (!workspaceId)
      return NextResponse.json(
        { error: "workspaceId query param required" },
        { status: 400 },
      );
    await requireWorkspaceAccess(workspaceId, user.id);
    const connections = await db.integrationConnection.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({
      connections: connections.map(scrubCredentials),
    });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json(
        { error: "Unable to load integrations" },
        { status: 500 },
      )
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = integrationSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success)
      return NextResponse.json(
        { error: "Invalid integration input", issues: parsed.error.flatten() },
        { status: 400 },
      );
    await requireWorkspaceAccess(parsed.data.workspaceId, user.id);
    const encryptedCredentials = encryptIntegrationCredentials(
      parsed.data.credentials,
    );
    const metadata = JSON.parse(JSON.stringify(parsed.data.metadata ?? {}));
    const existing = await db.integrationConnection.findFirst({
      where: {
        workspaceId: parsed.data.workspaceId,
        provider: parsed.data.provider,
      },
      select: { id: true },
    });
    const connection = existing
      ? await db.integrationConnection.update({
          where: { id: existing.id },
          data: { encryptedCredentials, credentials: null, metadata },
        })
      : await db.integrationConnection.create({
          data: {
            workspaceId: parsed.data.workspaceId,
            provider: parsed.data.provider,
            encryptedCredentials,
            metadata,
          },
        });
    return NextResponse.json({ connection: scrubCredentials(connection) });
  } catch (error) {
    console.error("Integration save failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return (
      authErrorResponse(error) ??
      NextResponse.json(
        { error: "Unable to save integration" },
        { status: 500 },
      )
    );
  }
}
