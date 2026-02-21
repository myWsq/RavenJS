import { describe, test, expect } from "@ravenjs/testing";
import { Raven, RavenContext } from "../main.ts";

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

		app.get("/", () => new Response("ok"));

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
