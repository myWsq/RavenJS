import { bench, group, run } from "mitata";
import { Raven, createHandler, J, type Handler } from "../../packages/core/main";

const simpleHandler: Handler = () => {
  return new Response("Hello, World!");
};

const jsonHandler: Handler = () => {
  return Response.json({ message: "Hello, World!", timestamp: Date.now() });
};

const bodySchema = J.object({
  properties: {
    name: J.string(),
    email: J.string(),
  },
});

const handlerWithBodyValidation = createHandler()
  .bodySchema(bodySchema)
  .handle(() => {
    return Response.json({ success: true });
  });

function createTestApp(): Raven {
  const app = new Raven();

  app.get("/simple", simpleHandler);
  app.get("/json", jsonHandler);
  app.post("/validated", handlerWithBodyValidation);

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
  app.post("/with-hooks-body", handlerWithBodyValidation);

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

const validPostBody = JSON.stringify({ name: "John", email: "john@example.com" });
const postRequest = new Request("http://localhost/validated", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: validPostBody,
});

const hookGetRequest = new Request("http://localhost/with-hooks", {
  method: "GET",
});

const hookPostRequest = new Request("http://localhost/with-hooks-body", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: validPostBody,
});

group("Simple GET Request", () => {
  bench("plain text response", async () => {
    await app.handleRequest(simpleGetRequest.clone());
  });

  bench("JSON response", async () => {
    await app.handleRequest(jsonGetRequest.clone());
  });
});

group("POST Request with Body Validation", () => {
  bench("with JTD body validation", async () => {
    await app.handleRequest(postRequest.clone());
  });
});

group("Request with Hooks", () => {
  bench("GET with onRequest + beforeHandle + beforeResponse", async () => {
    await appWithHooks.handleRequest(hookGetRequest.clone());
  });

  bench("POST with hooks + body validation", async () => {
    await appWithHooks.handleRequest(hookPostRequest.clone());
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
    await routerApp.handleRequest(firstRouteReq.clone());
  });

  bench("last route (of 100)", async () => {
    await routerApp.handleRequest(lastRouteReq.clone());
  });

  bench("not found (of 100)", async () => {
    await routerApp.handleRequest(notFoundReq.clone());
  });
});

group("Request with Dynamic Params", () => {
  const paramApp = new Raven();
  
  paramApp.get("/users/:userId/posts/:postId", () => {
    return Response.json({ userId: "123", postId: "456" });
  });
  
  const paramReq = new Request("http://localhost/users/123/posts/456", { method: "GET" });

  bench("with 2 dynamic params", async () => {
    await paramApp.handleRequest(paramReq.clone());
  });
});

group("Request with Query Validation", () => {
  const queryApp = new Raven();
  
  const querySchema = J.object({
    properties: {
      page: J.string(),
      limit: J.string(),
    },
  });
  
  const queryHandler = createHandler()
    .querySchema(querySchema)
    .handle(() => Response.json({ page: 1, limit: 10 }));
  
  queryApp.get("/search", queryHandler);
  
  const queryReq = new Request("http://localhost/search?page=1&limit=10", { method: "GET" });

  bench("with query validation", async () => {
    await queryApp.handleRequest(queryReq.clone());
  });
});

await run({
  colors: true,
});
