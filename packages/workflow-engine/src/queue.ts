import { Queue } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import type { WorkflowJobPayload } from "@liberation-os/types";

export const workflowQueueName = "workflow";
export const workflowJobName = "run-project";

let workflowQueue: Queue<WorkflowJobPayload, unknown, typeof workflowJobName> | null = null;

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

export function getWorkflowQueue(): Queue<WorkflowJobPayload, unknown, typeof workflowJobName> {
  workflowQueue ??= new Queue<WorkflowJobPayload, unknown, typeof workflowJobName>(workflowQueueName, {
    connection: createRedisConnection()
  });

  return workflowQueue;
}
