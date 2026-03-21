import { db, Prisma } from "@liberation-os/db";
import type {
  AgentContext,
  ContentItemDraft,
  CreateProjectInput,
  GoalInterpretation,
  WorkflowArtifacts,
  WorkflowStatus,
} from "@liberation-os/types";
import { createTraceId } from "@liberation-os/utils";
import { buildPlan } from "./planner";
import { AgentRegistry } from "./registry";

const defaultLogger = {
  info: (message: string, meta?: unknown) => console.log(message, meta ?? ""),
  error: (message: string, meta?: unknown) => console.error(message, meta ?? ""),
};

function createContext(projectId: string, workspaceId: string): AgentContext {
  return {
    userId: "system",
    workspaceId,
    projectId,
    traceId: createTraceId("wf"),
    modelProvider: "openai",
    logger: defaultLogger,
  };
}

export async function createProject(input: CreateProjectInput) {
  const workspaceId = input.workspaceId ?? (await getDemoWorkspaceId());
  const planning = await buildPlan(input);

  return db.project.create({
    data: {
      workspaceId,
      title: input.title ?? planning.interpretation.projectTitle,
      goalType: planning.interpretation.goalType,
      goal: input.goal,
      input: input as unknown as Prisma.InputJsonValue,
      status: "pending",
    },
  });
}

export async function getProjects() {
  return db.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      runs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      content: {
        take: 3,
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getProjectById(projectId: string) {
  return db.project.findUnique({
    where: { id: projectId },
    include: {
      workspace: true,
      content: { orderBy: { createdAt: "asc" } },
      runs: {
        orderBy: { createdAt: "desc" },
        include: {
          steps: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
}

export async function runProject(projectId: string, registry: AgentRegistry) {
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error(`Project not found: ${projectId}`);

  const planning = await buildPlan(project.input as unknown as CreateProjectInput);
  const context = createContext(project.id, project.workspaceId);

  const run = await db.workflowRun.create({
    data: {
      projectId: project.id,
      workflowName: planning.plan.workflowName,
      status: "running",
      startedAt: new Date(),
      artifacts: {
        interpretation: planning.interpretation,
        plan: planning.plan,
      } as unknown as Prisma.InputJsonValue,
      steps: {
        create: planning.plan.steps.map((step) => ({
          key: step.key,
          agentName: step.agentName,
          input: step.input as Prisma.InputJsonValue,
          status: "pending",
        })),
      },
    },
    include: { steps: { orderBy: { createdAt: "asc" } } },
  });

  await db.project.update({ where: { id: project.id }, data: { status: "running" } });

  const artifacts: WorkflowArtifacts = {
    interpretation: planning.interpretation,
    plan: planning.plan,
  };

  try {
    for (const dbStep of run.steps) {
      await updateStepStatus(dbStep.id, "running");
      const agent = registry.get(dbStep.agentName);
      const output = await agent.execute(dbStep.input as never, context, artifacts);
      artifacts[dbStep.key] = output;
      await db.workflowStep.update({
        where: { id: dbStep.id },
        data: {
          status: "completed",
          output: output as Prisma.InputJsonValue,
        },
      });
    }

    const contentDrafts = normalizeContentDrafts(artifacts, planning.interpretation);
    if (contentDrafts.length > 0) {
      await db.contentItem.createMany({
        data: contentDrafts.map((item) => ({
          projectId: project.id,
          type: item.type,
          platform: item.platform,
          title: item.title,
          body: item.body,
          metadata: (item.metadata ?? {}) as Prisma.InputJsonValue,
          status: item.status ?? "draft",
        })),
      });
    }

    await db.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        artifacts: artifacts as unknown as Prisma.InputJsonValue,
      },
    });

    await db.project.update({ where: { id: project.id }, data: { status: "waiting_review" } });

    return { runId: run.id, artifacts };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown workflow error";
    await db.workflowRun.update({
      where: { id: run.id },
      data: { status: "failed", errorLog: message, completedAt: new Date() },
    });
    await db.project.update({ where: { id: project.id }, data: { status: "failed" } });
    throw error;
  }
}

function normalizeContentDrafts(artifacts: WorkflowArtifacts, interpretation: GoalInterpretation): ContentItemDraft[] {
  if (Array.isArray(artifacts.contentDrafts)) {
    return artifacts.contentDrafts;
  }

  if (Array.isArray(artifacts.captions)) {
    const captions = artifacts.captions as Array<{ pillar: string; hook: string; script: string; caption: string }>;
    const schedule = Array.isArray(artifacts.schedule)
      ? (artifacts.schedule as Array<{ publishAtIso: string; platform: string }>)
      : [];

    return captions.map((item, index) => ({
      type: "social_post",
      platform: schedule[index]?.platform ?? interpretation.platforms[index % interpretation.platforms.length] ?? "tiktok",
      title: `Post ${index + 1}`,
      body: `${item.hook}\n\n${item.script}\n\n${item.caption}`,
      metadata: {
        pillar: item.pillar,
        hook: item.hook,
        publishAtIso: schedule[index]?.publishAtIso ?? null,
      },
      status: "draft",
    }));
  }

  if (Array.isArray(artifacts.articles)) {
    const articles = artifacts.articles as Array<{ title?: string; body?: string; slug?: string }>;
    return articles.map((article, index) => ({
      type: "article",
      title: article.title ?? `Article ${index + 1}`,
      body: article.body ?? "",
      metadata: article,
      status: "draft",
    }));
  }

  if (Array.isArray(artifacts.channelPosts)) {
    return artifacts.channelPosts as ContentItemDraft[];
  }

  return [];
}

async function updateStepStatus(stepId: string, status: WorkflowStatus) {
  await db.workflowStep.update({ where: { id: stepId }, data: { status } });
}

async function getDemoWorkspaceId(): Promise<string> {
  const workspace = await db.workspace.findFirst({ orderBy: { createdAt: "asc" } });
  if (!workspace) {
    const user = await db.user.create({
      data: {
        email: "demo@liberation.local",
        name: "Demo User",
        workspaces: { create: { name: "Liberation Lab" } },
      },
      include: { workspaces: true },
    });
    const created = user.workspaces[0];
    if (!created) throw new Error("Failed to bootstrap workspace");
    return created.id;
  }
  return workspace.id;
}
