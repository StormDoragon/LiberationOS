import { NextResponse } from "next/server";
import { createDefaultRegistry } from "@liberation-os/agent-packs";
import { runProject } from "@liberation-os/workflow-engine";
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
    return NextResponse.json({
      ok: true,
      result: await runProject(id, createDefaultRegistry()),
    });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json({ error: "Unable to run project" }, { status: 500 })
    );
  }
}
