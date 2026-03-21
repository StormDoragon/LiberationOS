import { Prisma } from "@prisma/client";
import { prisma } from "@liberation-os/db";
import type {
  CreateProjectResponse,
  ProjectListItem,
  ProjectSnapshot,
  WorkflowExecutionResult,
  WorkflowJobPayload,
  WorkflowStepSnapshot
} from "@liberation-os/types";
import { createLogger } from "@liberation-os/utils";
import { workflowJobName, workflowQueue } from "./queue";
import { runWorkflow } from "./run-workflow";

const logger = createLogger("workflow-engine");
const defaultUserEmail = "local@liberationos.dev";
const defaultWorkspaceName = "Default Workspace";
type ProjectWithRelations = Prisma.ProjectGetPayload<{
  include: {
    runs: {
      include: {
        steps: true;
      };
    };
    content: true;
  };
}>;

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function buildTitle(goal: string): string {
  const normalized = goal.trim().replace(/\s+/g, " ");
  return normalized.length > 80 ? `${normalized.slice(0, 77)}...` : normalized;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function ensureDefaultWorkspace() {
  const user = await prisma.user.upsert({
    where: { email: defaultUserEmail },
    update: {},
    create: {
      email: defaultUserEmail,
      name: "Local Operator"
    }
  });

  const existingWorkspace = await prisma.workspace.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" }
  });

  if (existingWorkspace) {
    return existingWorkspace;
  }

  return prisma.workspace.create({
    data: {
      userId: user.id,
      name: defaultWorkspaceName
    }
  });
}

function serializeSteps(steps: Array<{
  id: string;
  key: string;
  agentName: string;
  status: "pending" | "running" | "waiting_review" | "failed" | "completed";
  input: unknown;
  output: unknown;
  retryCount: number;
}>): WorkflowStepSnapshot[] {
  return steps.map((step) => ({
    id: step.id,
    key: step.key,
    agentName: step.agentName,
    status: step.status,
    input: step.input,
    output: step.output,
    retryCount: step.retryCount
  }));
}

function serializeProject(project: ProjectWithRelations): ProjectSnapshot {
  return {
    id: project.id,
    title: project.title,
    goalType: project.goalType,
    status: project.status,
    input: project.input,
    createdAt: project.createdAt.toISOString(),
    runs: project.runs.map((run: ProjectWithRelations["runs"][number]) => ({
      id: run.id,
      workflowName: run.workflowName,
      status: run.status,
      startedAt: toIso(run.startedAt),
      completedAt: toIso(run.completedAt),
      errorLog: run.errorLog,
      steps: serializeSteps(run.steps)
    })),
    content: project.content.map((item: ProjectWithRelations["content"][number]) => ({
      id: item.id,
      type: item.type,
      platform: item.platform,
      title: item.title,
      body: item.body,
      metadata: item.metadata,
      status: item.status
    }))
  };
}

export async function createProjectAndQueue(goal: string): Promise<CreateProjectResponse> {
  const workspace = await ensureDefaultWorkspace();

  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      title: buildTitle(goal),
      goalType: "queued_goal",
      goal,
      input: { goal },
      status: "pending",
      runs: {
        create: {
          workflowName: "viral-content-engine",
          status: "pending"
        }
      }
    },
    include: {
      runs: {
        orderBy: { id: "asc" }
      }
    }
  });

  const workflowRunId = project.runs[0]?.id;

  if (!workflowRunId) {
    throw new Error("Failed to create workflow run");
  }

  const payload: WorkflowJobPayload = {
    projectId: project.id,
    workflowRunId,
    goal
  };

  const job = await workflowQueue.add(workflowJobName, payload, {
    removeOnComplete: 100,
    removeOnFail: 100
  });

  return {
    projectId: project.id,
    workflowRunId,
    jobId: String(job.id),
    status: project.status
  };
}

export async function listProjects(): Promise<ProjectListItem[]> {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      runs: true,
      content: true
    }
  });

  return projects.map((project) => ({
    id: project.id,
    title: project.title,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    workflowCount: project.runs.length,
    contentCount: project.content.length
  }));
}

export async function getProjectSnapshot(projectId: string): Promise<ProjectSnapshot | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      runs: {
        orderBy: { id: "desc" },
        include: {
          steps: {
            orderBy: { id: "asc" }
          }
        }
      },
      content: {
        orderBy: { id: "asc" }
      }
    }
  });

  return project ? serializeProject(project) : null;
}

export async function executeQueuedWorkflow(payload: WorkflowJobPayload): Promise<WorkflowExecutionResult> {
  const { goal, projectId, workflowRunId } = payload;

  await prisma.workflowRun.update({
    where: { id: workflowRunId },
    data: {
      status: "running",
      startedAt: new Date(),
      completedAt: null,
      errorLog: null
    }
  });

  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: "running"
    }
  });

  await prisma.workflowStep.deleteMany({ where: { workflowRunId } });

  const goalStep = await prisma.workflowStep.create({
    data: {
      workflowRunId,
      key: "goal_interpreter",
      agentName: "goal-interpreter-agent",
      input: toJsonValue({ goal }),
      status: "running"
    }
  });

  const contentStep = await prisma.workflowStep.create({
    data: {
      workflowRunId,
      key: "content_generator",
      agentName: "content-generator-agent",
      input: toJsonValue({ goal }),
      status: "pending"
    }
  });

  try {
    const result = await runWorkflow(goal);

    await prisma.workflowStep.update({
      where: { id: goalStep.id },
      data: {
        status: "completed",
        output: toJsonValue(result.structuredGoal)
      }
    });

    await prisma.workflowStep.update({
      where: { id: contentStep.id },
      data: {
        status: "running",
        input: toJsonValue(result.structuredGoal)
      }
    });

    await prisma.contentItem.deleteMany({
      where: { projectId }
    });

    await prisma.contentItem.createMany({
      data: result.items.map((item, index) => ({
        projectId,
        type: "viral_post",
        platform: result.structuredGoal.platforms[0] ?? null,
        title: `Content ${index + 1}`,
        body: item.script,
        metadata: {
          hook: item.hook,
          caption: item.caption
        },
        status: "draft"
      }))
    });

    await prisma.workflowStep.update({
      where: { id: contentStep.id },
      data: {
        status: "completed",
        output: toJsonValue(result.items)
      }
    });

    await prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: {
        status: "waiting_review",
        completedAt: new Date()
      }
    });

    await prisma.project.update({
      where: { id: projectId },
      data: {
        goalType: result.structuredGoal.goalType,
        status: "waiting_review",
        input: toJsonValue({
          goal,
          structuredGoal: result.structuredGoal
        })
      }
    });

    logger.info("Workflow execution completed", { projectId, workflowRunId });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown workflow failure";

    await prisma.workflowStep.update({
      where: { id: goalStep.id },
      data: {
        status: "failed",
        output: { error: message }
      }
    }).catch(() => undefined);

    await prisma.workflowStep.update({
      where: { id: contentStep.id },
      data: {
        status: "failed",
        output: { error: message }
      }
    }).catch(() => undefined);

    await prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorLog: message
      }
    });

    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "failed"
      }
    });

    logger.error("Workflow execution failed", { projectId, workflowRunId, message });
    throw error;
  }
}