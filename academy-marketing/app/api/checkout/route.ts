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
      return NextResponse.json(
        { error: "Unable to create checkout session. Please try again." },
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
