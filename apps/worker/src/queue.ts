import { Queue } from "bullmq";
import type { ConnectionOptions } from "bullmq";

function createRedisConnection(): ConnectionOptions {
  const redisUrl = new URL(process.env.REDIS_URL ?? "redis://127.0.0.1:6379");
  return {
    host: redisUrl.hostname,
    port: redisUrl.port ? Number(redisUrl.port) : 6379,
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
    maxRetriesPerRequest: null,
  };
}

export const redisConnection = createRedisConnection();

export const workflowQueue = new Queue("workflow-runs", {
  connection: redisConnection,
});
