import { Worker } from "bullmq";
import { redisConnection } from "./queue";
import { createDefaultRegistry } from "@liberation-os/agent-packs";
import { runProject, workflowQueueName, workflowJobName, executeQueuedWorkflow } from "@liberation-os/workflow-engine";
import type { WorkflowJobPayload } from "@liberation-os/types";

const registry = createDefaultRegistry();

const worker = new Worker<WorkflowJobPayload>(
  workflowQueueName,
  async (job) => {
    const payload = job.data;
    console.log(`[worker] Processing job ${job.id} for project ${payload.projectId}`);

    // If we have a full payload with workflowRunId, use the queued path
    if (payload.workflowRunId) {
      return executeQueuedWorkflow(payload);
    }

    // Fallback: run via registry-based runner
    return runProject(payload.projectId, registry);
  },
  { connection: redisConnection },
);

worker.on("completed", (job) => {
  console.log(`[worker] Completed job ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`[worker] Failed job ${job?.id}:`, error.message);
});

console.log("LiberationOS worker started — listening on queue:", workflowQueueName);
