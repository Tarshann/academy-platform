import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const { cronAiShowcaseGenerator: run } = await import("../../dist/serverless.js");
    const result = await run();
    return res.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("[cron/ai-showcase-generator]", err);
    return res.json({ ok: false, error: err.message || String(err) });
  }
}
