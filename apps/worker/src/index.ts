import { Worker } from "bullmq";
import { redisConnection } from "./queue";
import { createDefaultRegistry } from "@liberation-os/agent-packs";
import { runProject, workflowQueueName, executeQueuedWorkflow } from "@liberation-os/workflow-engine";
import type { WorkflowJobPayload } from "@liberation-os/types";
import { createLogger } from "@liberation-os/utils";

const logger = createLogger("workflow-worker");
const registry = createDefaultRegistry();
const concurrency = Number(process.env.WORKER_CONCURRENCY ?? "2");

const worker = new Worker<WorkflowJobPayload>(
  workflowQueueName,
  async (job) => {
    const payload = job.data;
    logger.info("Processing workflow job", { jobId: job.id, projectId: payload.projectId });

    if (payload.workflowRunId) {
      return executeQueuedWorkflow(payload);
    }

    return runProject(payload.projectId, registry);
  },
  { connection: redisConnection, concurrency },
);

worker.on("completed", (job) => {
  logger.info("Workflow job completed", { jobId: job.id, projectId: job.data.projectId });
});

worker.on("failed", (job, error) => {
  logger.error("Workflow job failed", {
    jobId: job?.id,
    projectId: job?.data.projectId,
    error: error.message,
  });
});

async function shutdown(signal: NodeJS.Signals) {
  logger.info("Shutting down workflow worker", { signal });
  await worker.close();
  process.exit(0);
}

process.once("SIGTERM", (signal) => { void shutdown(signal); });
process.once("SIGINT", (signal) => { void shutdown(signal); });

logger.info("LiberationOS worker started", { queue: workflowQueueName, concurrency });
