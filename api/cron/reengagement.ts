import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const { run } = await import("../../server/cron/reengagement");
    const result = await run();
    return res.json({ ok: true, ...result });
  } catch (err: any) {
    const { logger } = await import("../../server/_core/logger");
    logger.error("[cron/reengagement]", err);
    return res.json({ ok: false, error: err.message || String(err) });
  }
}
