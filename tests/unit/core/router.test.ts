import { describe, expect, it } from "@ravenjs/testing";
import { RadixRouter } from "../../../modules/core";

describe("RadixRouter", () => {
	it("should match static routes", () => {
		const router = new RadixRouter<string>();
		router.add("GET", "/hello", "hello");
		router.add("GET", "/api/v1/users", "users");

		expect(router.find("GET", "/hello")?.data).toBe("hello");
		expect(router.find("GET", "/api/v1/users")?.data).toBe("users");
		expect(router.find("GET", "/wrong")).toBeNull();
	});

	it("should match param routes", () => {
		const router = new RadixRouter<string>();
		router.add("GET", "/user/:id", "user");
		router.add("GET", "/org/:orgId/project/:projectId", "project");

		const match1 = router.find("GET", "/user/123");
		expect(match1?.data).toBe("user");
		expect(match1?.params).toEqual({ id: "123" });

		const match2 = router.find("GET", "/org/raven/project/routing");
		expect(match2?.data).toBe("project");
		expect(match2?.params).toEqual({ orgId: "raven", projectId: "routing" });
	});

	it("should match wildcard routes", () => {
		const router = new RadixRouter<string>();
		router.add("GET", "/static/*", "static");

		expect(router.find("GET", "/static/css/main.css")?.data).toBe("static");
		expect(router.find("GET", "/static/js/bundle.js")?.data).toBe("static");
	});

	it("should handle method mismatch", () => {
		const router = new RadixRouter<string>();
		router.add("GET", "/test", "get");
		router.add("POST", "/test", "post");

		expect(router.find("GET", "/test")?.data).toBe("get");
		expect(router.find("POST", "/test")?.data).toBe("post");
		expect(router.find("PUT", "/test")).toBeNull();
	});
});
