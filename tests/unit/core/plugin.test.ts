import { describe, expect, it, mock } from "bun:test";
import {
	Raven,
	createAppState,
	currentAppStorage,
	definePlugin,
} from "../../../modules/core";

describe("Plugin System", () => {
	it("should register a simple sync plugin", async () => {
		const raven = new Raven();
		const load = mock((app: Raven) => {
			app.onRequest(() => {});
		});

		await raven.register(
			definePlugin({ name: "test-plugin", states: [], load }),
		);
		expect(load).toHaveBeenCalledWith(raven);
	});

	it("should register an async plugin", async () => {
		const raven = new Raven();
		let initialized = false;
		const load = async (_: Raven) => {
			await new Promise((resolve) => setTimeout(resolve, 10));
			initialized = true;
		};

		await raven.register(
			definePlugin({ name: "async-plugin", states: [], load }),
		);
		expect(initialized).toBe(true);
	});

	it("should register hooks on the main instance", async () => {
		const raven = new Raven();
		const hook = () => {};
		const plugin = definePlugin({
			name: "hooks-plugin",
			states: [],
			load(app: Raven) {
				app.onRequest(hook);
			},
		});

		await raven.register(plugin);
		// @ts-expect-error - accessing private hooks for testing
		expect(raven.hooks.onRequest).toContain(hook);
	});

	it("should return plugin states from register()", async () => {
		const raven = new Raven();
		const ConfigState = createAppState<{ value: string }>();

		const plugin = definePlugin({
			name: "state-plugin",
			states: [ConfigState] as const,
			// load runs inside app context; app not needed for this test
			load(_app: Raven) {
				ConfigState.set({ value: "ok" });
			},
		});

		const [config] = await raven.register(plugin);
		expect(config).toBe(ConfigState);
		// AppState is only readable inside app context
		currentAppStorage.run(raven, () => {
			expect(config.getOrFailed().value).toBe("ok");
		});
	});

	it("should create a plugin using factory pattern", async () => {
		const raven = new Raven();
		interface MyOptions {
			foo: string;
		}
		const myPlugin = (opts: MyOptions) =>
			definePlugin({
				name: "my-plugin",
				states: [],
				load(_app: Raven) {
					expect(opts.foo).toBe("bar");
				},
			});

		await raven.register(myPlugin({ foo: "bar" }));
	});
});
