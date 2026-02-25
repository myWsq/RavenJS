import { createAppState, definePlugin } from "@raven.js/core";

export function sqlPlugin(config: Bun.SQL.Options) {
  const ClientState = createAppState<Bun.SQL>();

  return definePlugin({
    name: "raven-sql",
    states: [ClientState],
    load() {
      const client = new Bun.SQL(config);
      ClientState.set(client);
    },
  });
}
