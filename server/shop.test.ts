import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" = "user"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "oauth",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://test.example.com" },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Shop Features", () => {
  it("allows public users to list products", async () => {
    const { ctx } = createAuthContext();
    ctx.user = undefined; // Public user
    const caller = appRouter.createCaller(ctx);

    const products = await caller.shop.products();
    expect(Array.isArray(products)).toBe(true);
  });

  it("allows public users to view active campaigns", async () => {
    const { ctx } = createAuthContext();
    ctx.user = undefined; // Public user
    const caller = appRouter.createCaller(ctx);

    const campaigns = await caller.shop.campaigns();
    expect(Array.isArray(campaigns)).toBe(true);
  });

  it("allows authenticated users to view their orders", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const orders = await caller.shop.myOrders();
    expect(Array.isArray(orders)).toBe(true);
  });

  it("allows admin users to create products", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.shop.admin.products.create({
      name: "Test Product",
      description: "Test description",
      price: 29.99,
      category: "apparel",
      stock: 10,
    });

    expect(result.success).toBe(true);
  });

  it("allows admin users to create campaigns", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.shop.admin.campaigns.create({
      name: "Test Campaign",
      description: "Test campaign description",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    expect(result.success).toBe(true);
  });
});
