// Use a conditional import for test runners to support both Bun and Node.js (via Vitest)
const { describe, test, expect } = await (async () => {
	// @ts-ignore
	if (typeof Bun !== "undefined") {
		return await import("bun:test");
	} else {
		return await import("vitest");
	}
})() as typeof import("vitest");

import { Raven } from "../main.ts";

describe("Raven Basic Server", () => {
	test("should initialize correctly", () => {
		const app = new Raven();
		expect(app).toBeDefined();
	});

	test("should start and stop the server", async () => {
		const app = new Raven();
		// Try a specific port
		const port = 3001;
		
		// Start listening
		await app.listen({ port });
		
		// Stop the server
		await app.stop();
	});
});
