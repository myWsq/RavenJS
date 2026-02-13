import { describe, it, expect } from "bun:test";
import { runScoped, createScopedToken, ContextToken, type Context } from "../index";

describe("ScopedToken Mechanism", () => {
  it("should support independent storage via tokens", async () => {
    const UserToken = createScopedToken<{ name: string }>("user");
    const RequestIdToken = createScopedToken<string>("requestId");

    await runScoped(async () => {
      UserToken.set({ name: "Alice" });
      RequestIdToken.set("req-123");

      expect(UserToken.get()).toEqual({ name: "Alice" });
      expect(RequestIdToken.get()).toBe("req-123");
    });
  });

  it("should maintain isolation between concurrent scopes", async () => {
    const TaskToken = createScopedToken<number>("taskId");

    const runTask = async (id: number) => {
      return runScoped(async () => {
        TaskToken.set(id);
        // Simulate async work
        await new Promise(r => setTimeout(r, Math.random() * 10));
        return TaskToken.get() === id;
      });
    };

    const results = await Promise.all([
      runTask(1),
      runTask(2),
      runTask(3),
      runTask(4),
    ]);

    expect(results.every(r => r === true)).toBe(true);
  });

  it("should handle nested scopes correctly", async () => {
    const LevelToken = createScopedToken<number>("level");

    await runScoped(async () => {
      LevelToken.set(1);
      expect(LevelToken.get()).toBe(1);

      await runScoped(async () => {
        // Nested scope should have its own empty store
        expect(LevelToken.get()).toBeUndefined();
        LevelToken.set(2);
        expect(LevelToken.get()).toBe(2);
      });

      // Back to parent scope, value should be preserved
      expect(LevelToken.get()).toBe(1);
    });
  });

  it("should throw when accessing tokens outside of runScoped", () => {
    const AnonymousToken = createScopedToken<string>("anon");
    
    expect(() => AnonymousToken.get()).not.toThrow(); // Should return undefined
    expect(AnonymousToken.get()).toBeUndefined();
    
    expect(() => AnonymousToken.set("value")).toThrow("Scope is not initialized");
    expect(() => AnonymousToken.getOrFailed()).toThrow("Scope is not initialized");
  });

  it("should work with predefined ContextToken", async () => {
    const mockContext: Context = {
      request: new Request("http://test.com"),
      url: new URL("http://test.com"),
      method: "POST",
      headers: new Headers(),
      body: null,
    };

    await runScoped(async () => {
      ContextToken.set(mockContext);
      expect(ContextToken.get()).toBe(mockContext);
      expect(ContextToken.getOrFailed().method).toBe("POST");
    });
  });
});
