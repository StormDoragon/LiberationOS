import { createLogger } from "@liberation-os/utils";

const logger = createLogger("worker");

async function main() {
  logger.info("LiberationOS worker booted");
}

main().catch((error) => {
  logger.error("Worker crashed", error);
  process.exit(1);
});
