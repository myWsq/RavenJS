import { describe, test, expect } from "bun:test";
import { Raven, RavenContext } from "../../../modules/core";

describe("Raven Lifecycle Hooks", () => {
	test("should execute hooks in order and have context access", async () => {
		const app = new Raven();
		const executionOrder: string[] = [];

		app.onRequest((req) => { 
			executionOrder.push(`onRequest:${req.method}`); 
		});
		app.beforeHandle(() => { executionOrder.push("beforeHandle"); });
		app.beforeResponse((res) => { 
			executionOrder.push("beforeResponse");
			return res;
		});

		app.get("/", () => new Response("ok"));

		// Trigger handleRequest manually for testing
		const request = new Request("http://localhost/");
		// @ts-ignore - access private for testing
		await app.handleRequest(request);

		expect(executionOrder).toEqual(["onRequest:GET", "beforeHandle", "beforeResponse"]);
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

		let errorCaught = false;
		app.onError((err) => {
			errorCaught = true;
			return new Response(err.message, { status: 500 });
		});

		app.get("/", () => { throw new Error("test error"); });

		const request = new Request("http://localhost/");
		// @ts-ignore
		const response = await app.handleRequest(request);

		expect(errorCaught).toBe(true);
		expect(await response.text()).toBe("test error");
	});
});
