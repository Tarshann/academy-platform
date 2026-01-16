import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Gallery Features", () => {
  it("allows public users to list gallery photos", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    const photos = await caller.gallery.list();
    expect(Array.isArray(photos)).toBe(true);
  });

  it("allows public users to filter by category", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    const photos = await caller.gallery.byCategory({ category: "training" });
    expect(Array.isArray(photos)).toBe(true);
  });

  it("allows admins to upload photos", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.gallery.admin.upload({
      title: "Test Photo",
      description: "Test description",
      imageUrl: "https://example.com/photo.jpg",
      imageKey: "test-key",
      category: "training",
    });

    expect(result.success).toBe(true);
  });

  it("prevents non-admins from uploading photos", async () => {
    const ctx = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.gallery.admin.upload({
        title: "Test Photo",
        description: "Test description",
        imageUrl: "https://example.com/photo.jpg",
        imageKey: "test-key",
        category: "training",
      })
    ).rejects.toThrow();
  });
});

describe("Blog Features", () => {
  it("allows public users to list published blog posts", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    const posts = await caller.blog.list();
    expect(Array.isArray(posts)).toBe(true);
  });

  it("allows admins to create blog posts", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.blog.admin.create({
      title: "Test Post",
      slug: "test-post-" + Date.now(),
      excerpt: "Test excerpt",
      content: "Test content",
      category: "training_tips",
    });

    expect(result.success).toBe(true);
  });

  it("prevents non-admins from creating blog posts", async () => {
    const ctx = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.blog.admin.create({
        title: "Test Post",
        slug: "test-post",
        excerpt: "Test excerpt",
        content: "Test content",
        category: "training_tips",
      })
    ).rejects.toThrow();
  });
});

// Payment features are tested in admin.test.ts

describe("Schedule Features", () => {
  it("allows members to view upcoming schedules", async () => {
    const ctx = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);

    const schedules = await caller.schedules.upcoming();
    expect(Array.isArray(schedules)).toBe(true);
  });

  it("allows admins to create schedules", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.schedules.create({
      title: "Test Session",
      description: "Test description",
      startTime: new Date(Date.now() + 86400000), // Tomorrow
      endTime: new Date(Date.now() + 90000000), // Tomorrow + 1 hour
      location: "Test Location",
      maxParticipants: 20,
      programId: 1, // Required field
    });

    expect(result.success).toBe(true);
  });
});
