import { NextResponse } from "next/server";
import { createDefaultRegistry } from "@liberation-os/agent-packs";
import { runProject } from "@liberation-os/workflow-engine";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  const registry = createDefaultRegistry();
  const result = await runProject(id, registry);
  return NextResponse.json({ ok: true, result });
}
