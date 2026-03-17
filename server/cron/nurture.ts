import { processNurtureQueue } from "../nurture";
import { logger } from "../_core/logger";

export async function run() {
  logger.info("[cron/nurture] Processing nurture queue");
  const result = await processNurtureQueue();
  logger.info("[cron/nurture] Complete", result);
  return result;
}
