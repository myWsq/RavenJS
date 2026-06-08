import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm"],
  platform: "node",
  dts: true,
  clean: true,
  // `hono` 为 peerDependency、`node:async_hooks` 为内建模块，tsdown 默认将
  // dependencies/peerDependencies 与 node 内建标记为 external，不打进产物。
});
