import { describe, expect, it, mock } from "bun:test";
import { Raven, RavenContext } from "../../../modules/core";

describe("Routing System", () => {
	it("should match simple GET route", async () => {
		const raven = new Raven();
		const handler = mock(() => new Response("ok"));
		raven.get("/hello", handler);

		// @ts-ignore
		const response = await raven.handleRequest(new Request("http://localhost/hello"));
		expect(await response.text()).toBe("ok");
		expect(handler).toHaveBeenCalled();
	});

	it("should extract path parameters", async () => {
		const raven = new Raven();
		raven.get("/user/:id", () => {
			const ctx = RavenContext.get();
			return new Response(`User ${ctx?.params.id}`);
		});

		// @ts-ignore
		const response = await raven.handleRequest(new Request("http://localhost/user/123"));
		expect(await response.text()).toBe("User 123");
	});

	it("should extract multiple path parameters", async () => {
		const raven = new Raven();
		raven.get("/org/:orgId/project/:projectId", () => {
			const ctx = RavenContext.get();
			return new Response(`Org: ${ctx?.params.orgId}, Project: ${ctx?.params.projectId}`);
		});

		// @ts-ignore
		const response = await raven.handleRequest(
			new Request("http://localhost/org/raven/project/routing"),
		);
		expect(await response.text()).toBe("Org: raven, Project: routing");
	});

	it("should extract query parameters", async () => {
		const raven = new Raven();
		raven.get("/search", () => {
			const ctx = RavenContext.get();
			return new Response(`Search: ${ctx?.query.q}`);
		});

		// @ts-ignore
		const response = await raven.handleRequest(
			new Request("http://localhost/search?q=raven"),
		);
		expect(await response.text()).toBe("Search: raven");
	});

	it("should support route groups and prefix stacking", async () => {
		const raven = new Raven();
		await raven.group("/api", async (api) => {
			await api.group("/v1", (v1) => {
				v1.get("/users", () => new Response("v1 users"));
			});
		});

		// @ts-ignore
		const response = await raven.handleRequest(
			new Request("http://localhost/api/v1/users"),
		);
		expect(await response.text()).toBe("v1 users");
	});

	it("should handle scoped hooks in groups", async () => {
		const raven = new Raven();
		const order: string[] = [];

		raven.onRequest(() => {
			order.push("global onRequest");
		});

		await raven.group("/admin", (admin) => {
			admin.beforeHandle(() => {
				order.push("admin beforeHandle");
			});
			admin.get("/dashboard", () => {
				order.push("handler");
				return new Response("admin ok");
			});
		});

		raven.get("/public", () => {
			order.push("public handler");
			return new Response("public ok");
		});

		// 1. Admin request
		// @ts-ignore
		await raven.handleRequest(new Request("http://localhost/admin/dashboard"));
		expect(order).toEqual(["global onRequest", "admin beforeHandle", "handler"]);

		// 2. Public request (should NOT trigger admin hook)
		order.length = 0;
		// @ts-ignore
		await raven.handleRequest(new Request("http://localhost/public"));
		expect(order).toEqual(["global onRequest", "public handler"]);
	});

	it("should assemble context correctly (onRequest vs beforeHandle)", async () => {
		const raven = new Raven();
		let onRequestParams: any = undefined;
		let beforeHandleParams: any = undefined;

		raven.onRequest(() => {
			const ctx = RavenContext.get();
			if (ctx) {
				onRequestParams = ctx.params;
			}
		});

		raven.get("/test/:id", () => {
			const ctx = RavenContext.get();
			if (ctx) {
				beforeHandleParams = ctx.params;
			}
			return new Response("ok");
		});

		// @ts-ignore
		await raven.handleRequest(new Request("http://localhost/test/123"));

		expect(onRequestParams).toBeUndefined(); // In Phase 1, params are not yet matched
		expect(beforeHandleParams).toEqual({ id: "123" }); // In Phase 2, params are available
	});

	it("should return 404 for unknown routes", async () => {
		const raven = new Raven();
		// @ts-ignore
		const response = await raven.handleRequest(new Request("http://localhost/unknown"));
		expect(response.status).toBe(404);
		expect(await response.text()).toBe("Not Found");
	});
});
