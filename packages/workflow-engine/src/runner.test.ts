import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  projectCreate: vi.fn(),
  projectFindUnique: vi.fn(),
  projectUpdate: vi.fn(),
  workflowRunCreate: vi.fn(),
  workflowRunUpdate: vi.fn(),
  workflowStepUpdate: vi.fn(),
  contentCreateMany: vi.fn(),
}));

vi.mock("@liberation-os/db", () => ({
  Prisma: {},
  db: {
    project: {
      create: mocks.projectCreate,
      findUnique: mocks.projectFindUnique,
      update: mocks.projectUpdate,
    },
    workflowRun: {
      create: mocks.workflowRunCreate,
      update: mocks.workflowRunUpdate,
    },
    workflowStep: { update: mocks.workflowStepUpdate },
    contentItem: { createMany: mocks.contentCreateMany },
    workspace: { findFirst: vi.fn() },
  },
}));

import { AgentRegistry } from "./registry";
import { createProject, runProject } from "./runner";

describe("project creation and execution orchestration", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a planned project in the requested workspace", async () => {
    mocks.projectCreate.mockImplementation(async ({ data }) => ({
      id: "project-1",
      ...data,
    }));
    const result = await createProject({
      workspaceId: "workspace-1",
      goal: "Create 2 TikTok posts about tea",
    });
    expect(mocks.projectCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        workspaceId: "workspace-1",
        goalType: "viral_content_batch",
        status: "pending",
      }),
    });
    expect(result.id).toBe("project-1");
  });

  it("executes planned agents, persists artifacts, and advances project status", async () => {
    mocks.projectFindUnique.mockResolvedValue({
      id: "project-1",
      workspaceId: "workspace-1",
      input: { goal: "Create 1 TikTok post about tea" },
    });
    mocks.workflowRunCreate.mockResolvedValue({
      id: "run-1",
      steps: [
        {
          id: "step-1",
          key: "pillars",
          agentName: "viral.generate-pillars",
          input: {},
        },
      ],
    });
    const registry = new AgentRegistry();
    registry.register({
      name: "viral.generate-pillars",
      description: "test",
      execute: vi.fn().mockResolvedValue(["Tea basics"]),
    });

    const result = await runProject("project-1", registry);

    expect(result.runId).toBe("run-1");
    expect(mocks.workflowStepUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "completed" }),
      }),
    );
    expect(mocks.workflowRunUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "completed" }),
      }),
    );
    expect(mocks.projectUpdate).toHaveBeenLastCalledWith({
      where: { id: "project-1" },
      data: { status: "waiting_review" },
    });
  });
});
