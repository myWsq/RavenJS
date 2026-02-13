import { expect, test, describe } from "bun:test";
import { Raven } from "../index.ts";

describe("Raven Basic Server", () => {
	test("should initialize correctly", () => {
		const app = new Raven();
		expect(app).toBeDefined();
	});

	test("should start and stop the server", async () => {
		const app = new Raven();
		// Port 0 tells Bun to pick an available port
		const port = 0;
		
		// Start listening
		app.listen({ port });
		
		// Get the actual port if possible, or just assume it started since no error
		// For now we'll just test the logic
		
		// Stop the server
		app.stop();
	});
});
