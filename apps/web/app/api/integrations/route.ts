import { NextRequest, NextResponse } from "next/server";
import { db } from "@liberation-os/db";

/**
 * GET /api/integrations?workspaceId=...
 * Returns all IntegrationConnections for a workspace (credentials scrubbed).
 *
 * POST /api/integrations
 * Body: { workspaceId, provider, credentials, metadata? }
 * Returns the newly created IntegrationConnection (credentials scrubbed).
 */

function scrubCredentials(conn: {
  id: string;
  workspaceId: string;
  provider: string;
  credentials: unknown;
  metadata: unknown;
  createdAt: Date;
}) {
  const { credentials: _creds, ...safe } = conn;
  return { ...safe, connected: true };
}

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId query param required" },
      { status: 400 },
    );
  }

  const connections = await db.integrationConnection.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ connections: connections.map(scrubCredentials) });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    workspaceId: string;
    provider: string;
    credentials: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  };

  if (!body.workspaceId || !body.provider || !body.credentials) {
    return NextResponse.json(
      { error: "workspaceId, provider, and credentials are required" },
      { status: 400 },
    );
  }

  // Upsert — one connection per provider per workspace
  const existing = await db.integrationConnection.findFirst({
    where: { workspaceId: body.workspaceId, provider: body.provider },
  });

  // JSON round-trip ensures Prisma's InputJsonValue constraint is satisfied
  type JsonVal = ReturnType<typeof JSON.parse>;
  const credentials = JSON.parse(JSON.stringify(body.credentials)) as JsonVal;
  const metadata = JSON.parse(JSON.stringify(body.metadata ?? {})) as JsonVal;

  const conn = existing
    ? await db.integrationConnection.update({
        where: { id: existing.id },
        data: { credentials, metadata },
      })
    : await db.integrationConnection.create({
        data: {
          workspaceId: body.workspaceId,
          provider: body.provider,
          credentials,
          metadata,
        },
      });

  return NextResponse.json({ connection: scrubCredentials(conn) });
}
