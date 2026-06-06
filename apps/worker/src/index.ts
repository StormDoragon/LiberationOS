import { workflowQueueName } from "@liberation-os/workflow-engine";
import { createLogger } from "@liberation-os/utils";
import { startWorkflowWorker } from "./worker";

const logger = createLogger("workflow-worker");
const worker = startWorkflowWorker();

async function shutdown(signal: NodeJS.Signals) {
  logger.info("Shutting down workflow worker", { signal });
  await worker.close();
  process.exit(0);
}

process.once("SIGTERM", (signal) => {
  void shutdown(signal);
});
process.once("SIGINT", (signal) => {
  void shutdown(signal);
});

logger.info("LiberationOS worker started", { queue: workflowQueueName });
