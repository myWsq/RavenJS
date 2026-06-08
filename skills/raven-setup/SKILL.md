---
name: raven-setup
description: Set up RavenJS (@raven.js/core) in a project — install the npm package and its hono peer, wire a runtime-appropriate serve entry, and verify a minimal app runs. Only trigger when explicitly invoked by name (e.g. "use raven-setup" or called from another skill).
compatibility: Requires Node 20+, Bun, or Deno (server) and a package manager
---

# RavenJS Setup Skill

Set up a project to use RavenJS as an installed npm package (`@raven.js/core`). This skill does **not** build a full application — it only gets the package installed and a serve entry wired so the app can start.

> RavenJS 3.x ships as a standard npm package. There is no CLI, no `install-raven`, no `raven sync`, and no framework source copied into the project.

## Step 0 — Confirm interaction language

Ask the user which language the Agent should use, then keep using it throughout.

## Step 1 — Detect the runtime and package manager

Determine the target runtime and package manager:

- Node (>=20), Bun, or Deno — check `node -v` / `bun -v` / `deno -v` and any runtime hints in the project (`package.json` engines, `deno.json`).
- Package manager — infer from lockfile (`package-lock.json` → npm, `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lock` → bun).

RavenJS supports Node + Bun + Deno on the **server**. It does **not** support edge / Cloudflare Workers.

## Step 2 — Install the package and peers

Install `@raven.js/core` and its `hono` peer dependency:

```bash
npm install @raven.js/core hono
# or: pnpm add / yarn add / bun add
```

On **Node**, also install the serve adapter:

```bash
npm install @hono/node-server
```

On **Bun** and **Deno**, no adapter is needed (native fetch serving).

## Step 3 — Wire a serve entry

`app.ready()` returns a Web-standard fetch handler `(request: Request) => Promise<Response>`. The framework does not listen on a port itself — serving is the runtime's job:

- **Node** (`@hono/node-server`):

  ```ts
  import { serve } from "@hono/node-server";
  import { app } from "./app";

  serve({ fetch: await app.ready(), port: 3000 });
  ```

- **Bun** (native):

  ```ts
  import { app } from "./app";

  export default { port: 3000, fetch: await app.ready() };
  ```

- **Deno** (native):

  ```ts
  import { app } from "./app";

  Deno.serve({ port: 3000 }, await app.ready());
  ```

Create only the serve entry here; the `./app` composition root and routes are written via **raven-use**.

## Step 4 — Verify with a minimal app

Create a temporary `_raven_setup_test.ts` that imports `Raven` from `@raven.js/core`, registers one route, calls `await app.ready()`, dispatches a single in-memory `Request`, and exits (no long-running server):

```ts
import { Raven } from "@raven.js/core";

const app = new Raven();
app.get("/_health", () => new Response("ok"));
const fetch = await app.ready();
const res = await fetch(new Request("http://localhost/_health"));
if ((await res.text()) !== "ok") throw new Error("RavenJS setup verification failed");
console.log("RavenJS OK");
```

Run it with the project runtime (`node`, `bun run`, or `deno run`). If it fails, fix install/config issues (missing `hono` peer, wrong `moduleResolution`, ESM/`type: module`) and retry.

## Step 5 — Clean up and report

Delete `_raven_setup_test.ts`, then tell the user:

- which package(s) were installed and for which runtime
- where the serve entry was created
- that the project is ready — use **raven-use** to write application code

## Step 6 — Offer to learn the API

Suggest running **raven-learn** before writing code, so the Agent loads the installed core's GUIDE and pattern docs.
