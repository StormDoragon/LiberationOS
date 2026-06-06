import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  workspaceFindFirst: vi.fn(),
  projectFindFirst: vi.fn(),
}));
vi.mock("../auth", () => ({ auth: mocks.auth }));
vi.mock("@liberation-os/db", () => ({
  db: {
    workspace: { findFirst: mocks.workspaceFindFirst },
    project: { findFirst: mocks.projectFindFirst },
    contentItem: { findFirst: vi.fn() },
  },
}));

import {
  requireProjectAccess,
  requireUser,
  requireWorkspaceAccess,
} from "./api-auth";

describe("API authentication and ownership guards", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects requests without an authenticated user", async () => {
    mocks.auth.mockResolvedValue(null);
    await expect(requireUser()).rejects.toEqual(
      expect.objectContaining({
        status: 401,
        message: "Authentication required",
      }),
    );
  });

  it("returns the authenticated user", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-1", email: "owner@test.dev" },
    });
    await expect(requireUser()).resolves.toMatchObject({ id: "user-1" });
  });

  it("enforces workspace and project ownership in database queries", async () => {
    mocks.workspaceFindFirst.mockResolvedValue(null);
    mocks.projectFindFirst.mockResolvedValue(null);
    await expect(
      requireWorkspaceAccess("workspace-2", "user-1"),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      requireProjectAccess("project-2", "user-1"),
    ).rejects.toMatchObject({ status: 404 });
    expect(mocks.workspaceFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "workspace-2", userId: "user-1" },
      }),
    );
    expect(mocks.projectFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "project-2", workspace: { userId: "user-1" } },
      }),
    );
  });
});
