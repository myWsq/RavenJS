import { describe, expect, it, vi } from "@ravenjs/testing";
import { Raven, createPlugin } from "../main";

describe("Plugin System", () => {
	it("should register a simple sync plugin", async () => {
		const raven = new Raven();
		const plugin = vi.fn((instance: Raven) => {
			instance.onRequest(() => {});
		});

		await raven.register(plugin);
		expect(plugin).toHaveBeenCalledWith(raven);
	});

	it("should register an async plugin", async () => {
		const raven = new Raven();
		let initialized = false;
		const plugin = async (instance: Raven) => {
			await new Promise((resolve) => setTimeout(resolve, 10));
			initialized = true;
		};

		await raven.register(plugin);
		expect(initialized).toBe(true);
	});

	it("should register hooks on the main instance", async () => {
		const raven = new Raven();
		const hook = () => {};
		const plugin = (instance: Raven) => {
			instance.onRequest(hook);
		};

		await raven.register(plugin);
		// @ts-ignore - accessing private hooks for testing
		expect(raven.hooks.onRequest).toContain(hook);
	});

	it("should create a plugin using factory pattern", async () => {
		const raven = new Raven();
		interface MyOptions {
			foo: string;
		}
		const myPlugin = (opts: MyOptions) => createPlugin((instance) => {
			expect(opts.foo).toBe("bar");
		});

		await raven.register(myPlugin({ foo: "bar" }));
	});

	it("should execute hooks in registration order", async () => {
		const raven = new Raven();
		const order: string[] = [];

		raven.onRequest(() => {
			order.push("root");
		});

		await raven.register(async (instance) => {
			instance.onRequest(() => {
				order.push("plugin");
			});
		});

		// @ts-ignore - calling private handleRequest
		await raven.handleRequest(new Request("http://localhost"));

		expect(order).toEqual(["root", "plugin"]);
	});
});
