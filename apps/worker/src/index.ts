import { createLogger } from "@liberation-os/utils";
import { startWorkflowWorker } from "./worker";

const logger = createLogger("worker");

async function main() {
  startWorkflowWorker();
  logger.info("LiberationOS worker booted");
}

main().catch((error) => {
  logger.error("Worker crashed", error);
  process.exit(1);
});
