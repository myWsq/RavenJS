import { bench, group, run } from "mitata";
import { RadixRouter } from "../../packages/core/main";

function createRouter(routeCount: number): RadixRouter<{ id: number }> {
  const router = new RadixRouter<{ id: number }>();
  for (let i = 0; i < routeCount; i++) {
    router.add("GET", `/static/path/segment/${i}`, { id: i });
  }
  return router;
}

function createDynamicRouter(routeCount: number): RadixRouter<{ id: number }> {
  const router = new RadixRouter<{ id: number }>();
  for (let i = 0; i < routeCount; i++) {
    router.add("GET", `/users/:userId/posts/:postId/comments/${i}`, { id: i });
  }
  return router;
}

function createWildcardRouter(routeCount: number): RadixRouter<{ id: number }> {
  const router = new RadixRouter<{ id: number }>();
  for (let i = 0; i < routeCount; i++) {
    router.add("GET", `/api/v${i}/*`, { id: i });
  }
  return router;
}

const router100 = createRouter(100);
const router1000 = createRouter(1000);
const router10000 = createRouter(10000);

const dynamicRouter100 = createDynamicRouter(100);
const dynamicRouter1000 = createDynamicRouter(1000);

const wildcardRouter100 = createWildcardRouter(100);

group("Static Route Matching", () => {
  bench("100 routes - first", () => {
    router100.find("GET", "/static/path/segment/0");
  });

  bench("100 routes - middle", () => {
    router100.find("GET", "/static/path/segment/50");
  });

  bench("100 routes - last", () => {
    router100.find("GET", "/static/path/segment/99");
  });

  bench("1000 routes - first", () => {
    router1000.find("GET", "/static/path/segment/0");
  });

  bench("1000 routes - middle", () => {
    router1000.find("GET", "/static/path/segment/500");
  });

  bench("1000 routes - last", () => {
    router1000.find("GET", "/static/path/segment/999");
  });

  bench("10000 routes - first", () => {
    router10000.find("GET", "/static/path/segment/0");
  });

  bench("10000 routes - middle", () => {
    router10000.find("GET", "/static/path/segment/5000");
  });

  bench("10000 routes - last", () => {
    router10000.find("GET", "/static/path/segment/9999");
  });
});

group("Dynamic Route Matching (:param)", () => {
  bench("100 routes - with params", () => {
    dynamicRouter100.find("GET", "/users/123/posts/456/comments/50");
  });

  bench("1000 routes - with params", () => {
    dynamicRouter1000.find("GET", "/users/123/posts/456/comments/500");
  });
});

group("Wildcard Route Matching (*)", () => {
  bench("100 routes - wildcard match", () => {
    wildcardRouter100.find("GET", "/api/v50/any/path/here");
  });

  bench("100 routes - deep wildcard", () => {
    wildcardRouter100.find("GET", "/api/v50/a/b/c/d/e/f/g");
  });
});

group("Route Not Found", () => {
  bench("miss - 100 routes", () => {
    router100.find("GET", "/nonexistent/path");
  });

  bench("miss - 10000 routes", () => {
    router10000.find("GET", "/nonexistent/path");
  });
});

await run({
  colors: true,
});
