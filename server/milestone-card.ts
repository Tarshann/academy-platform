import { logger } from "./_core/logger";

/**
 * Generates a milestone celebration card as SVG, converts to PNG via sharp,
 * and uploads to storage. Returns the public URL of the card image.
 */
export async function generateMilestoneCard(params: {
  athleteName: string;
  metricName: string;
  newValue: number;
  unit: string;
  improvementDisplay: string;
}): Promise<string | null> {
  const { athleteName, metricName, newValue, unit, improvementDisplay } = params;

  try {
    const svg = generateMilestoneCardSvg({
      athleteName,
      metricName,
      newValue,
      unit,
      improvementDisplay,
    });

    let sharp: any;
    try {
      sharp = (await import("sharp")).default;
    } catch {
      logger.warn("[milestone-card] sharp not available, skipping PNG generation");
      return null;
    }

    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

    const { storagePut } = await import("./storage");
    const timestamp = Date.now();
    const safeName = athleteName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const key = `milestones/${safeName}_${timestamp}.png`;

    const { url } = await storagePut(key, pngBuffer, "image/png");
    return url;
  } catch (err) {
    logger.error("[milestone-card] Generation failed", err);
    return null;
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateMilestoneCardSvg(params: {
  athleteName: string;
  metricName: string;
  newValue: number;
  unit: string;
  improvementDisplay: string;
}): string {
  const { athleteName, metricName, newValue, unit, improvementDisplay } = params;

  const name = escapeXml(athleteName);
  const metric = escapeXml(metricName);
  const value = escapeXml(`${newValue} ${unit}`);
  const improvement = escapeXml(improvementDisplay);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0a"/>
      <stop offset="100%" style="stop-color:#1a1a2e"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#d4a843"/>
      <stop offset="100%" style="stop-color:#f0d080"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="600" height="400" rx="16" fill="url(#bg)"/>

  <!-- Gold accent bar -->
  <rect x="0" y="0" width="600" height="6" rx="3" fill="url(#gold)"/>

  <!-- Star icon -->
  <text x="300" y="70" text-anchor="middle" font-size="40" fill="#d4a843">&#9733;</text>

  <!-- NEW PERSONAL RECORD -->
  <text x="300" y="110" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="16" fill="#d4a843" letter-spacing="4">NEW PERSONAL RECORD</text>

  <!-- Athlete Name -->
  <text x="300" y="160" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="28" fill="#ffffff">${name}</text>

  <!-- Metric Name -->
  <text x="300" y="200" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#999999">${metric}</text>

  <!-- Value -->
  <text x="300" y="265" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="52" fill="#ffffff">${value}</text>

  <!-- Improvement -->
  <rect x="175" y="290" width="250" height="36" rx="18" fill="#d4a843" opacity="0.2"/>
  <text x="300" y="314" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="16" fill="#d4a843">${improvement}</text>

  <!-- Footer -->
  <text x="300" y="375" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#666666">THE ACADEMY · GALLATIN, TN</text>
</svg>`;
}
