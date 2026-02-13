import { createPlugin, type Plugin } from "@ravenjs/core";

export function routerPlugin(options: any = {}): Plugin {
  return createPlugin((instance) => {
    // Placeholder for future router logic
    console.log("Router plugin initialized", options);
  });
}
