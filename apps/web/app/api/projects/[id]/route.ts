import { NextResponse } from "next/server";
import { getProjectById } from "@liberation-os/workflow-engine";
import {
  authErrorResponse,
  requireProjectAccess,
  requireUser,
} from "../../../../lib/api-auth";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await requireProjectAccess(id, user.id);
    return NextResponse.json({ project: await getProjectById(id) });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json({ error: "Unable to load project" }, { status: 500 })
    );
  }
}
