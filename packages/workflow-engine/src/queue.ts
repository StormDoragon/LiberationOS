import { Queue } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import type { WorkflowJobPayload } from "@liberation-os/types";

export const workflowQueueName = "workflow";
const workflowJobName = "run-project";

export function createRedisConnection(): ConnectionOptions {
  const redisUrl = new URL(process.env.REDIS_URL ?? "redis://127.0.0.1:6379");
  const port = redisUrl.port ? Number(redisUrl.port) : 6379;

  return {
    host: redisUrl.hostname,
    port,
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
    db: redisUrl.pathname && redisUrl.pathname !== "/" ? Number(redisUrl.pathname.slice(1)) : 0,
    tls: redisUrl.protocol === "rediss:" ? {} : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  };
}

export const workflowQueue = new Queue<WorkflowJobPayload, unknown, typeof workflowJobName>(workflowQueueName, {
  connection: createRedisConnection()
});

export { workflowJobName };