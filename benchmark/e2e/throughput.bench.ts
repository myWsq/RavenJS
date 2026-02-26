import { bench, group, run } from "mitata";
import { Raven, type Handler } from "../../modules/core";

const simpleHandler: Handler = () => {
  return new Response("Hello, World!");
};

const jsonHandler: Handler = () => {
  return Response.json({ message: "Hello, World!", timestamp: Date.now() });
};

function createTestApp(): Raven {
  const app = new Raven();

  app.get("/simple", simpleHandler);
  app.get("/json", jsonHandler);

  return app;
}

function createAppWithHooks(): Raven {
  const app = new Raven();

  app.onRequest((req) => {
    void req.url;
  });

  app.beforeHandle(() => {
    void Date.now();
  });

  app.beforeResponse((res) => {
    return res;
  });

  app.get("/with-hooks", simpleHandler);

  return app;
}

const app = createTestApp();
const appWithHooks = createAppWithHooks();

const simpleGetRequest = new Request("http://localhost/simple", {
  method: "GET",
});

const jsonGetRequest = new Request("http://localhost/json", {
  method: "GET",
});

const hookGetRequest = new Request("http://localhost/with-hooks", {
  method: "GET",
});

group("Simple GET Request", () => {
  bench("plain text response", async () => {
    await app.handle(simpleGetRequest.clone());
  });

  bench("JSON response", async () => {
    await app.handle(jsonGetRequest.clone());
  });
});

group("Request with Hooks", () => {
  bench("GET with onRequest + beforeHandle + beforeResponse", async () => {
    await appWithHooks.handle(hookGetRequest.clone());
  });
});

group("Request Routing Overhead", () => {
  const routerApp = new Raven();

  for (let i = 0; i < 100; i++) {
    routerApp.get(`/route${i}`, simpleHandler);
  }

  const firstRouteReq = new Request("http://localhost/route0", { method: "GET" });
  const lastRouteReq = new Request("http://localhost/route99", { method: "GET" });
  const notFoundReq = new Request("http://localhost/nonexistent", { method: "GET" });

  bench("first route (of 100)", async () => {
    await routerApp.handle(firstRouteReq.clone());
  });

  bench("last route (of 100)", async () => {
    await routerApp.handle(lastRouteReq.clone());
  });

  bench("not found (of 100)", async () => {
    await routerApp.handle(notFoundReq.clone());
  });
});

group("Request with Dynamic Params", () => {
  const paramApp = new Raven();

  paramApp.get("/users/:userId/posts/:postId", () => {
    return Response.json({ userId: "123", postId: "456" });
  });

  const paramReq = new Request("http://localhost/users/123/posts/456", { method: "GET" });

  bench("with 2 dynamic params", async () => {
    await paramApp.handle(paramReq.clone());
  });
});

await run({
  colors: true,
});
