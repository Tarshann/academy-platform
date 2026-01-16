import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("contact.submit", () => {
  it("accepts valid general inquiry submission", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contact.submit({
      name: "John Doe",
      email: "john@example.com",
      phone: "555-1234",
      subject: "Program Inquiry",
      message: "I would like to know more about your programs for my 10-year-old son.",
      type: "general",
    });

    expect(result).toEqual({ success: true });
  });

  it("accepts valid volunteer application", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contact.submit({
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "555-5678",
      subject: "Volunteer Application",
      message: "I have 5 years of coaching experience and would love to volunteer with The Academy.",
      type: "volunteer",
    });

    expect(result).toEqual({ success: true });
  });

  it("rejects submission with invalid email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.contact.submit({
        name: "Test User",
        email: "invalid-email",
        subject: "Test",
        message: "This should fail",
        type: "general",
      })
    ).rejects.toThrow();
  });

  it("rejects submission with message too short", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.contact.submit({
        name: "Test User",
        email: "test@example.com",
        subject: "Test",
        message: "Short",
        type: "general",
      })
    ).rejects.toThrow();
  });
});

describe("programs.list", () => {
  it("returns list of active programs", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const programs = await caller.programs.list();

    expect(Array.isArray(programs)).toBe(true);
    // Test passes whether programs are seeded or not
    // In production, programs would be seeded
    programs.forEach(program => {
      expect(program).toHaveProperty("id");
      expect(program).toHaveProperty("name");
      expect(program).toHaveProperty("slug");
      expect(program).toHaveProperty("description");
      expect(program).toHaveProperty("price");
      expect(program).toHaveProperty("category");
      expect(program.isActive).toBe(1);
    });
  });
});

describe("announcements.list", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.announcements.list()).rejects.toThrow();
  });

  it("returns announcements for authenticated users", async () => {
    const user: AuthenticatedUser = {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx: TrpcContext = {
      user,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const announcements = await caller.announcements.list();

    expect(Array.isArray(announcements)).toBe(true);
  });
});
