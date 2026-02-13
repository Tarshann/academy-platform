import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/checkout
 *
 * Creates a Stripe checkout session by calling the platform API's
 * guest checkout endpoint. Returns the Stripe checkout URL.
 *
 * Body: { productId: string, email?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { productId, email } = await request.json();

    if (!productId || typeof productId !== "string") {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const platformApiUrl = process.env.PLATFORM_API_URL;
    if (!platformApiUrl) {
      return NextResponse.json(
        { error: "Checkout is not configured yet. Please call us to register." },
        { status: 503 }
      );
    }

    const res = await fetch(
      `${platformApiUrl}/api/trpc/payment.createGuestCheckout`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            productIds: [productId],
            ...(email && { email }),
          },
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("[checkout] Platform error:", res.status, text);

      // Surface tRPC error messages when available
      let detail = "Unable to create checkout session. Please try again.";
      try {
        const parsed = JSON.parse(text);
        const trpcMsg =
          parsed?.error?.json?.message ||
          parsed?.error?.message ||
          parsed?.message;
        if (trpcMsg) detail = trpcMsg;
      } catch {
        // If the platform returned HTML instead of JSON, the server
        // is not deployed — flag that explicitly.
        if (text.includes("<!DOCTYPE") || text.includes("<html")) {
          detail =
            "Platform API is not running. The server may still be deploying.";
        }
      }

      return NextResponse.json({ error: detail }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error("[checkout] Non-JSON response:", contentType, text.slice(0, 200));
      return NextResponse.json(
        { error: "Platform API returned an unexpected response. The server may still be deploying." },
        { status: 502 }
      );
    }

    const data = await res.json();
    const url = data?.result?.data?.json?.url || data?.result?.data?.url;

    if (!url) {
      console.error("[checkout] No URL in response:", JSON.stringify(data));
      return NextResponse.json(
        { error: "Unable to create checkout session. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[checkout] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
