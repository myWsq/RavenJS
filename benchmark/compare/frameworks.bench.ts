import { bench, group, run } from "mitata";
import { Raven } from "../../modules/core";

let Hono: any = null;
let Elysia: any = null;

try {
  const honoModule = await import("hono");
  Hono = honoModule.Hono;
  console.log("✓ Hono loaded");
} catch {
  console.log("⚠ Hono not installed - skipping Hono benchmarks");
  console.log("  Install with: bun add hono");
}

try {
  const elysiaModule = await import("elysia");
  Elysia = elysiaModule.Elysia;
  console.log("✓ Elysia loaded");
} catch {
  console.log("⚠ Elysia not installed - skipping Elysia benchmarks");
  console.log("  Install with: bun add elysia");
}

console.log("\n");

const ravenApp = new Raven();
ravenApp.get("/", () => new Response("Hello, World!"));
ravenApp.get("/json", () => Response.json({ message: "Hello, World!" }));
ravenApp.get("/users/:id", () => Response.json({ id: "123" }));

let honoApp: any = null;
if (Hono) {
  honoApp = new Hono();
  honoApp.get("/", (c: any) => c.text("Hello, World!"));
  honoApp.get("/json", (c: any) => c.json({ message: "Hello, World!" }));
  honoApp.get("/users/:id", (c: any) => c.json({ id: c.req.param("id") }));
}

let elysiaApp: any = null;
if (Elysia) {
  elysiaApp = new Elysia()
    .get("/", () => "Hello, World!")
    .get("/json", () => ({ message: "Hello, World!" }))
    .get("/users/:id", ({ params }: any) => ({ id: params.id }));
}

const textRequest = new Request("http://localhost/");
const jsonRequest = new Request("http://localhost/json");
const paramRequest = new Request("http://localhost/users/123");

group("Plain Text Response - GET /", () => {
  bench("RavenJS", async () => {
    await ravenApp.handle(textRequest.clone());
  });

  if (honoApp) {
    bench("Hono", async () => {
      await honoApp.fetch(textRequest.clone());
    });
  }

  if (elysiaApp) {
    bench("Elysia", async () => {
      await elysiaApp.handle(textRequest.clone());
    });
  }
});

group("JSON Response - GET /json", () => {
  bench("RavenJS", async () => {
    await ravenApp.handle(jsonRequest.clone());
  });

  if (honoApp) {
    bench("Hono", async () => {
      await honoApp.fetch(jsonRequest.clone());
    });
  }

  if (elysiaApp) {
    bench("Elysia", async () => {
      await elysiaApp.handle(jsonRequest.clone());
    });
  }
});

group("Dynamic Route - GET /users/:id", () => {
  bench("RavenJS", async () => {
    await ravenApp.handle(paramRequest.clone());
  });

  if (honoApp) {
    bench("Hono", async () => {
      await honoApp.fetch(paramRequest.clone());
    });
  }

  if (elysiaApp) {
    bench("Elysia", async () => {
      await elysiaApp.handle(paramRequest.clone());
    });
  }
});

group("Router Scaling - 100 routes", () => {
  const raven100 = new Raven();
  for (let i = 0; i < 100; i++) {
    raven100.get(`/route${i}`, () => new Response(`Route ${i}`));
  }

  let hono100: any = null;
  if (Hono) {
    hono100 = new Hono();
    for (let i = 0; i < 100; i++) {
      hono100.get(`/route${i}`, (c: any) => c.text(`Route ${i}`));
    }
  }

  let elysia100: any = null;
  if (Elysia) {
    elysia100 = new Elysia();
    for (let i = 0; i < 100; i++) {
      elysia100.get(`/route${i}`, () => `Route ${i}`);
    }
  }

  const req50 = new Request("http://localhost/route50");
  const req99 = new Request("http://localhost/route99");

  bench("RavenJS - middle route", async () => {
    await raven100.handle(req50.clone());
  });

  bench("RavenJS - last route", async () => {
    await raven100.handle(req99.clone());
  });

  if (hono100) {
    bench("Hono - middle route", async () => {
      await hono100.fetch(req50.clone());
    });

    bench("Hono - last route", async () => {
      await hono100.fetch(req99.clone());
    });
  }

  if (elysia100) {
    bench("Elysia - middle route", async () => {
      await elysia100.handle(req50.clone());
    });

    bench("Elysia - last route", async () => {
      await elysia100.handle(req99.clone());
    });
  }
});

if (!Hono && !Elysia) {
  console.log("\n⚠ No comparison frameworks installed.");
  console.log("  To run framework comparisons, install one or more:");
  console.log("    bun add hono");
  console.log("    bun add elysia");
  console.log("\n  Running RavenJS-only benchmarks...\n");
}

await run({
  colors: true,
});
