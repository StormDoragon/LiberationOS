import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requireWorkspaceAccess: vi.fn(),
  getDefaultWorkspace: vi.fn(),
  createProject: vi.fn(),
  getProjects: vi.fn(),
}));
vi.mock("../../../lib/api-auth", () => ({
  requireUser: mocks.requireUser,
  requireWorkspaceAccess: mocks.requireWorkspaceAccess,
  authErrorResponse: (error: { status?: number; message?: string }) =>
    error.status
      ? Response.json({ error: error.message }, { status: error.status })
      : null,
}));
vi.mock("@liberation-os/workflow-engine", () => ({
  createProject: mocks.createProject,
  getDefaultWorkspace: mocks.getDefaultWorkspace,
  getProjects: mocks.getProjects,
}));

import { GET, POST } from "./route";

describe("protected projects API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a project only after workspace ownership is verified", async () => {
    mocks.requireUser.mockResolvedValue({ id: "user-1" });
    mocks.requireWorkspaceAccess.mockResolvedValue({ id: "workspace-1" });
    mocks.createProject.mockResolvedValue({ id: "project-1" });
    const request = new NextRequest("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "ck12345678901234567890123",
        goal: "Create a campaign",
      }),
      headers: { "content-type": "application/json" },
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(mocks.requireWorkspaceAccess).toHaveBeenCalledWith(
      "ck12345678901234567890123",
      "user-1",
    );
    expect(mocks.createProject).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: "workspace-1" }),
    );
  });

  it("rejects unauthenticated project listing", async () => {
    mocks.requireUser.mockRejectedValue(
      Object.assign(new Error("Authentication required"), { status: 401 }),
    );
    const response = await GET();
    expect(response.status).toBe(401);
    expect(mocks.getProjects).not.toHaveBeenCalled();
  });
});
