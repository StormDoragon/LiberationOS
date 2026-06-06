import { NextRequest, NextResponse } from "next/server";
import {
  createProject,
  getDefaultWorkspace,
  getProjects,
} from "@liberation-os/workflow-engine";
import { z } from "zod";
import {
  authErrorResponse,
  requireUser,
  requireWorkspaceAccess,
} from "../../../lib/api-auth";

const createProjectSchema = z
  .object({
    workspaceId: z.string().cuid().optional(),
    title: z.string().trim().min(1).max(200).optional(),
    goal: z.string().trim().min(1).max(10_000),
    goalType: z.string().trim().min(1).max(100).optional(),
  })
  .passthrough();

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ projects: await getProjects(user.id) });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json({ error: "Unable to list projects" }, { status: 500 })
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = createProjectSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success)
      return NextResponse.json(
        { error: "Invalid project input", issues: parsed.error.flatten() },
        { status: 400 },
      );
    const workspaceId = parsed.data.workspaceId
      ? (await requireWorkspaceAccess(parsed.data.workspaceId, user.id)).id
      : (await getDefaultWorkspace(user.id)).id;
    const project = await createProject({ ...parsed.data, workspaceId });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json({ error: "Unable to create project" }, { status: 500 })
    );
  }
}
