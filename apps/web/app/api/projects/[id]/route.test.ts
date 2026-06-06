import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requireProjectAccess: vi.fn(),
  getProjectById: vi.fn(),
}));
vi.mock("../../../../lib/api-auth", () => ({
  requireUser: mocks.requireUser,
  requireProjectAccess: mocks.requireProjectAccess,
  authErrorResponse: (error: { status?: number; message?: string }) =>
    error.status
      ? Response.json({ error: error.message }, { status: error.status })
      : null,
}));
vi.mock("@liberation-os/workflow-engine", () => ({
  getProjectById: mocks.getProjectById,
}));

import { GET } from "./route";

describe("protected project detail API", () => {
  it("does not load a project when ownership enforcement fails", async () => {
    mocks.requireUser.mockResolvedValue({ id: "user-1" });
    mocks.requireProjectAccess.mockRejectedValue(
      Object.assign(new Error("Project not found"), { status: 404 }),
    );
    const response = await GET(
      new Request("http://localhost/api/projects/project-2"),
      { params: Promise.resolve({ id: "project-2" }) },
    );
    expect(response.status).toBe(404);
    expect(mocks.getProjectById).not.toHaveBeenCalled();
  });
});
