import { defineAppState, definePlugin } from "@raven.js/core";

export const ClientState = defineAppState<Bun.SQL>();

export function sqlPlugin(config: Bun.SQL.Options) {
  return definePlugin({
    name: "raven-sql",
    load(_app, set) {
      set(ClientState, new Bun.SQL(config));
    },
  });
}
