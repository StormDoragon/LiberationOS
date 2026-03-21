import { Worker } from "bullmq";
import { executeQueuedWorkflow, createRedisConnection, workflowQueueName } from "@liberation-os/workflow-engine";
import type { WorkflowJobPayload } from "@liberation-os/types";
import { createLogger } from "@liberation-os/utils";

const logger = createLogger("workflow-worker");

export function startWorkflowWorker() {
  const worker = new Worker<WorkflowJobPayload>(
    workflowQueueName,
    async (job) => {
      logger.info("Processing workflow job", { jobId: job.id, projectId: job.data.projectId });
      return executeQueuedWorkflow(job.data);
    },
    {
      connection: createRedisConnection()
    }
  );

  worker.on("completed", (job) => {
    logger.info("Workflow job completed", { jobId: job.id, projectId: job.data.projectId });
  });

  worker.on("failed", (job, error) => {
    logger.error("Workflow job failed", {
      jobId: job?.id,
      projectId: job?.data.projectId,
      error: error.message
    });
  });

  return worker;
}