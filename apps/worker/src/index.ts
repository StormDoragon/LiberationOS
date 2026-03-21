import { Worker } from "bullmq";
import { redisConnection } from "./queue";
import { createDefaultRegistry } from "@liberation-os/agent-packs";
import { runProject } from "@liberation-os/workflow-engine";

const registry = createDefaultRegistry();

const worker = new Worker(
  "workflow-runs",
  async (job) => {
    const projectId = String(job.data.projectId);
    console.log(`Running workflow for project ${projectId}`);
    return runProject(projectId, registry);
  },
  { connection: redisConnection },
);

worker.on("completed", (job) => {
  console.log(`Completed job ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`Failed job ${job?.id}`, error);
});

console.log("LiberationOS worker started");
