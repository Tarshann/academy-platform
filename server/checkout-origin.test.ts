import { describe, expect, it } from "vitest";
import { buildCheckoutUrl, resolveCheckoutOrigin } from "./_core/checkout";

const createReq = (headers: Record<string, string | string[] | undefined>) =>
  ({ headers }) as { headers: Record<string, string | string[] | undefined> };

describe("resolveCheckoutOrigin", () => {
  it("prefers siteUrl when provided", () => {
    const req = createReq({ origin: "https://academy.test" });
    const origin = resolveCheckoutOrigin(req, "https://fallback.test");
    expect(origin).toBe("https://fallback.test");
  });

  it("falls back to forwarded host/proto when origin is invalid", () => {
    const req = createReq({
      origin: "https://null",
      "x-forwarded-proto": "https",
      "x-forwarded-host": "academy-forwarded.test",
    });
    const origin = resolveCheckoutOrigin(req, "");
    expect(origin).toBe("https://academy-forwarded.test");
  });

  it("normalizes siteUrl without scheme", () => {
    const req = createReq({});
    const origin = resolveCheckoutOrigin(req, "academy-platform.test");
    expect(origin).toBe("https://academy-platform.test");
  });

  it("returns localhost when no origin data is available", () => {
    const req = createReq({});
    const origin = resolveCheckoutOrigin(req, "");
    expect(origin).toBe("http://localhost:3000");
  });
});

describe("buildCheckoutUrl", () => {
  it("keeps raw placeholders in query strings", () => {
    const url = buildCheckoutUrl(
      "https://academy.test",
      "/payment/success",
      "session_id={CHECKOUT_SESSION_ID}"
    );
    expect(url).toBe(
      "https://academy.test/payment/success?session_id={CHECKOUT_SESSION_ID}"
    );
  });
});
