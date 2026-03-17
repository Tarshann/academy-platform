import { evaluateCronGovernance } from "../_core/governed-procedure";
import { processNurtureQueue } from "../nurture";
import { logger } from "../_core/logger";

export async function run() {
  logger.info("[cron/nurture] Processing nurture queue");
  // Strix governance check — when enabled, cron must be approved before executing
  const guard = await evaluateCronGovernance("cron.nurture", "nurture");
  if (!guard.allowed) {
    logger.info("[cron/nurture] Governance denied: " + (guard.reason || "no approval"));
    return { skipped: true, reason: guard.reason || "governance denied" };
  }
  const result = await processNurtureQueue();
  logger.info("[cron/nurture] Complete", result);
  return result;
}
