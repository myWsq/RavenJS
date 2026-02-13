import { describe, test, expect } from "@ravenjs/testing";
import { Raven } from "../main.ts";

describe("Raven Basic Server", () => {
	test("should initialize correctly", () => {
		const app = new Raven();
		expect(app).toBeDefined();
	});

	// test("should start and stop the server", async () => {
	// 	const app = new Raven();
	// 	// Use a random port to avoid EADDRINUSE
	// 	const port = 3000 + Math.floor(Math.random() * 1000);
	// 	
	// 	// Start listening
	// 	await app.listen({ port });
	// 	
	// 	// Stop the server
	// 	await app.stop();
	// });
});
