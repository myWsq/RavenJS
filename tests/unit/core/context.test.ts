import { describe, test, expect } from "bun:test";
import { Raven, RavenContext } from "../../../modules/core";

describe("Raven Context Assembly", () => {
	test("onRequest should NOT have access to params and query, but beforeHandle SHOULD", async () => {
		const app = new Raven();
		let onRequestHasCtx = true;
		let beforeHandleParams: any = null;
		let beforeHandleQuery: any = null;

		app.onRequest((req) => {
			const ctx = RavenContext.get();
			onRequestHasCtx = !!ctx;
		});

		app.beforeHandle(() => {
			const ctx = RavenContext.get();
			if (ctx) {
				beforeHandleParams = { ...ctx.params };
				beforeHandleQuery = { ...ctx.query };
			}
		});

		app.get("/user/:id", () => new Response("ok"));

		const request = new Request("http://localhost/user/123?name=raven");
		// @ts-ignore
		await app.handleRequest(request);

		// onRequest should NOT have access to context token
		expect(onRequestHasCtx).toBe(false);

		// beforeHandle should have populated params/query
		expect(beforeHandleParams).toEqual({ id: "123" });
		expect(beforeHandleQuery).toEqual({ name: "raven" });
	});
});
