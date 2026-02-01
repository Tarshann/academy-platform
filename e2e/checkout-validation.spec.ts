import { expect, test } from "@playwright/test";

test.use({
  browserName: "webkit",
  viewport: { width: 390, height: 844 },
});

test.describe("checkout validation on signup", () => {
  test("checkout selected classes avoids pattern error", async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__assignedCheckoutUrl = "";
      const originalAssign = window.location.assign.bind(window.location);
      const originalReplace = window.location.replace.bind(window.location);

      window.location.assign = (url: string | URL) => {
        (window as any).__assignedCheckoutUrl = String(url);
      };

      window.location.replace = (url: string | URL) => {
        (window as any).__assignedCheckoutUrl = String(url);
      };

      (window as any).__restoreLocation = () => {
        window.location.assign = originalAssign;
        window.location.replace = originalReplace;
      };
    });

    await page.goto("/signup", { waitUntil: "domcontentloaded" });

    const addToCart = page.getByRole("button", { name: /add to cart/i }).first();
    await expect(addToCart).toBeVisible();
    await addToCart.click();

    const checkoutButton = page.getByRole("button", {
      name: /checkout selected classes/i,
    });
    await expect(checkoutButton).toBeVisible();

    await checkoutButton.click();

    const patternErrorToast = page.getByText(
      "The string did not match the expected pattern."
    );

    const redirectDetected = page
      .waitForFunction(
        () => Boolean((window as any).__assignedCheckoutUrl),
        null,
        { timeout: 15_000 }
      )
      .then(() => "redirect");

    const patternErrorDetected = patternErrorToast
      .waitFor({ state: "visible", timeout: 15_000 })
      .then(() => "pattern_error");

    const outcome = await Promise.race([
      redirectDetected,
      patternErrorDetected,
    ]);

    expect(outcome).toBe("redirect");

    const assignedUrl = await page.evaluate(
      () => (window as any).__assignedCheckoutUrl as string
    );
    expect(assignedUrl).not.toEqual("");
    expect(assignedUrl).toMatch(/^https:\/\//);
  });
});
