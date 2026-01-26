import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
const hasDatabase = Boolean(process.env.DATABASE_URL);
const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY);
const describeDb = hasDatabase ? describe : describe.skip;
const describeStripe = hasStripe ? describe : describe.skip;

function createAdminContext(): TrpcContext {
  const adminUser: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@academy.com",
    name: "Admin User",
    loginMethod: "oauth",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: adminUser,
    req: {
      protocol: "https",
      headers: { origin: "https://test.academy.com" },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createMemberContext(): TrpcContext {
  const memberUser: AuthenticatedUser = {
    id: 2,
    openId: "member-user",
    email: "member@academy.com",
    name: "Member User",
    loginMethod: "oauth",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: memberUser,
    req: {
      protocol: "https",
      headers: { origin: "https://test.academy.com" },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describeDb("Admin Access Control", () => {
  it("allows admin users to access admin.programs.list", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.programs.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("blocks non-admin users from accessing admin.programs.list", async () => {
    const ctx = createMemberContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.programs.list()).rejects.toThrow(
      "Admin access required"
    );
  });

  it("allows admin users to access admin.schedules.list", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.schedules.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("blocks non-admin users from accessing admin.schedules.list", async () => {
    const ctx = createMemberContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.schedules.list()).rejects.toThrow(
      "Admin access required"
    );
  });
});

describeDb("Schedule Registration", () => {
  it("allows authenticated users to register for schedules", async () => {
    const ctx = createMemberContext();
    const caller = appRouter.createCaller(ctx);

    // This will fail if no schedule exists, but tests the endpoint structure
    try {
      await caller.schedules.register({ scheduleId: 999 });
    } catch (error: any) {
      // Expected to fail with database error since schedule doesn't exist
      // But should not fail with auth error
      expect(error.message).not.toContain("UNAUTHORIZED");
      expect(error.message).not.toContain("FORBIDDEN");
    }
  });
});

describeStripe("Payment Checkout", () => {
  it("creates checkout session for authenticated users", async () => {
    const ctx = createMemberContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.payment.createCheckout({
      productId: "group-workout",
    });

    expect(result).toHaveProperty("url");
    expect(typeof result.url).toBe("string");
    expect(result.url).toContain("checkout.stripe.com");
  });

  it("rejects checkout for invalid product", async () => {
    const ctx = createMemberContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.payment.createCheckout({
        productId: "invalid-product-id",
      })
    ).rejects.toThrow("Product not found");
  });
});

describeDb("Contact Submissions", () => {
  it("allows public users to submit contact forms", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contact.submit({
      name: "Test User",
      email: "test@example.com",
      subject: "Test Inquiry",
      message: "This is a test message for the contact form.",
      type: "general",
    });

    expect(result).toEqual({ success: true });
  });

  it("allows admin users to view contact submissions", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contact.list();
    expect(Array.isArray(result)).toBe(true);
  });
});
