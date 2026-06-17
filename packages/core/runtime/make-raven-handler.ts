import type { Context as HonoContext } from "hono";
import { Context } from "../context/context.ts";
import { RavenContext } from "../state/builtins.ts";
import { internalSet } from "../state/descriptors.ts";
import type { RouteData } from "../app/route-data.ts";
import type { RavenHooks } from "../app/types.ts";
import { handleResponseHooks } from "./handle-response.ts";
import { isResponse } from "./is-response.ts";
import { processStates } from "./process-states.ts";

/**
 * 将一条 RouteData 包装为 Hono handler。
 *
 * 该 handler 始终运行在 Raven.dispatch 建立的 AsyncLocalStorage 上下文内
 * （dispatch 在 `currentAppStorage.run` + `requestStorage.run` 的回调里 `await this.hono.fetch(request)`，
 * ALS 上下文沿 await 链传播到 Hono 匹配出的本 handler）。
 *
 * 职责精确对应原 dispatch-request.ts 命中路由后的内层逻辑：
 * 写入 RavenContext（带 params/query）→ processStates（请求 schema 校验 + 写 4 个内建 state）
 * → beforeHandle 钩子（短路则跑 beforeResponse 后返回）→ 业务 handler → beforeResponse。
 *
 * Hono 的 context `c` 仅在本文件内部使用，绝不暴露给应用作者：
 * handler/hook/plugin 一律通过 ambient state 读取请求信息。
 */
export function makeRavenHandler(routeData: RouteData, hooks: RavenHooks) {
  return async (c: HonoContext): Promise<Response> => {
    // Hono 会把 HEAD 请求自动派发到同路径的 GET 路由并执行其完整生命周期（仅末尾剥离 body），
    // 这会让带副作用的 GET handler 被 HEAD 触发。而 RavenJS 的 HttpMethod 不含 HEAD（无法注册 HEAD 路由），
    // 原实现对 HEAD 一律按未命中返回 404。这里复刻该严格方法匹配语义：HEAD 一律走 notFound（→ onError 链）。
    if (c.req.method === "HEAD") {
      return c.notFound();
    }

    const request = c.req.raw;
    const params = c.req.param() as Record<string, string>;

    // 从原始请求 URL 重建 query，保持与旧实现一致的“同名末值覆盖”语义
    // （Hono 的 c.req.query() 取首值，会改变重复 query key 的行为）。
    const query: Record<string, string> = {};
    new URL(request.url).searchParams.forEach((value, key) => {
      query[key] = value;
    });

    internalSet(RavenContext, new Context(request, params, query));
    await processStates(request, params, query, routeData.schemas);

    for (const hook of hooks.beforeHandle) {
      const result = await hook();
      if (isResponse(result)) {
        return handleResponseHooks(result, hooks.beforeResponse);
      }
    }

    return handleResponseHooks(await routeData.handler(), hooks.beforeResponse);
  };
}
