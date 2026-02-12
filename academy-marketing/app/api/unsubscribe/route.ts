import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/unsubscribe?email=...
 *
 * Handles unsubscribe requests from nurture email links.
 * Marks the lead as "unsubscribed" via the platform API,
 * then shows a confirmation page.
 */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  if (!email) {
    return new NextResponse(unsubscribePage("Missing email address."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Forward to platform API to mark as unsubscribed
  const platformApiUrl = process.env.PLATFORM_API_URL;
  if (platformApiUrl) {
    try {
      await fetch(`${platformApiUrl}/api/trpc/leads.unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { email } }),
      });
    } catch {
      // If platform is unreachable, still show confirmation
    }
  }

  return new NextResponse(
    unsubscribePage("You've been unsubscribed from The Academy emails. You won't receive any more messages from us."),
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

function unsubscribePage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Unsubscribe — The Academy</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f9fafb; color: #333; }
    .card { background: #fff; border-radius: 12px; padding: 40px; max-width: 480px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { color: #1a1a1a; font-size: 24px; margin: 0 0 16px; }
    p { line-height: 1.6; color: #666; }
    a { color: #CFB53B; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>The Academy</h1>
    <p>${message}</p>
    <p><a href="https://academytn.com">Back to academytn.com</a></p>
  </div>
</body>
</html>`;
}
