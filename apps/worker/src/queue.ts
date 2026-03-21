import { Queue } from "bullmq";
import { workflowQueueName, createRedisConnection } from "@liberation-os/workflow-engine";

export const redisConnection = createRedisConnection();

export const workflowQueue = new Queue(workflowQueueName, {
  connection: redisConnection,
});
