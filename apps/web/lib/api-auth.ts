import { db } from "@liberation-os/db";
import { NextResponse } from "next/server";
import { auth } from "../auth";

export class ApiAuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403 | 404,
  ) {
    super(message);
    this.name = "ApiAuthError";
  }
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id)
    throw new ApiAuthError("Authentication required", 401);
  return session.user;
}

export async function requireWorkspaceAccess(
  workspaceId: string,
  userId: string,
) {
  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, userId },
    select: { id: true },
  });
  if (!workspace) throw new ApiAuthError("Workspace not found", 404);
  return workspace;
}

export async function requireProjectAccess(projectId: string, userId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, workspace: { userId } },
    select: { id: true, workspaceId: true },
  });
  if (!project) throw new ApiAuthError("Project not found", 404);
  return project;
}

export async function requireContentAccess(contentId: string, userId: string) {
  const content = await db.contentItem.findFirst({
    where: { id: contentId, project: { workspace: { userId } } },
    select: { id: true, projectId: true },
  });
  if (!content) throw new ApiAuthError("Content not found", 404);
  return content;
}

export function authErrorResponse(error: unknown) {
  if (error instanceof ApiAuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  return null;
}
