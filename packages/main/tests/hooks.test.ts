// Use a conditional import for test runners to support both Bun and Node.js (via Vitest)
const { describe, test, expect } = await (async () => {
	// @ts-ignore
	if (typeof Bun !== "undefined") {
		return await import("bun:test");
	} else {
		return await import("vitest");
	}
})() as typeof import("vitest");

import { Raven } from "../index.ts";

describe("Raven Lifecycle Hooks", () => {
	test("should execute hooks in order", async () => {
		const app = new Raven();
		const executionOrder: string[] = [];

		app.onRequest(() => { executionOrder.push("onRequest"); });
		app.beforeHandle(() => { executionOrder.push("beforeHandle"); });
		app.beforeResponse((res) => { 
			executionOrder.push("beforeResponse");
			return res;
		});

		// Trigger handleRequest manually for testing
		const request = new Request("http://localhost/");
		// @ts-ignore - access private for testing
		await app.handleRequest(request);

		expect(executionOrder).toEqual(["onRequest", "beforeHandle", "beforeResponse"]);
	});

	test("should short-circuit on onRequest return", async () => {
		const app = new Raven();
		const executionOrder: string[] = [];

		app.onRequest(() => { 
			executionOrder.push("onRequest");
			return new Response("short-circuit");
		});
		app.beforeHandle(() => { executionOrder.push("beforeHandle"); });

		const request = new Request("http://localhost/");
		// @ts-ignore
		const response = await app.handleRequest(request);

		expect(executionOrder).toEqual(["onRequest"]);
		expect(await response.text()).toBe("short-circuit");
	});

	test("should handle errors with onError", async () => {
		const app = new Raven();
		app.beforeHandle(() => {
			throw new Error("test error");
		});

		app.onError((error) => {
			return new Response(`Caught: ${(error as Error).message}`, { status: 500 });
		});

		const request = new Request("http://localhost/");
		// @ts-ignore
		const response = await app.handleRequest(request);

		expect(response.status).toBe(500);
		expect(await response.text()).toBe("Caught: test error");
	});
});
