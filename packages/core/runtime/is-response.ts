/**
 * 判断一个值是否为 HTTP Response。
 *
 * 不能用 `value instanceof Response`：部分运行时适配器会替换 `globalThis.Response`，
 * 让框架捕获到的 Response 与构造时的 Response 来自不同的类，导致 instanceof 失效。
 * 典型例子是 `@hono/node-server`（默认 `overrideGlobalObjects: true`）：它把全局
 * `Response` 换成自己的轻量实现，但 `Response.json()` 等静态工厂仍返回原生 Response 实例，
 * 两者互不为 instanceof——结果 handler / 钩子返回的 Response 被误判为“非 Response”而丢弃，
 * 业务错误最终穿透为默认 500/404（见 GitHub issue #4）。
 *
 * 改用 `Symbol.toStringTag` 品牌检测：所有符合规范的 Response 实现（原生及各适配器）
 * 都会让 `Object.prototype.toString.call(res)` 返回 `"[object Response]"`，
 * 该判断跨 realm / 跨全局替换都成立，且对普通对象、null、undefined 安全。
 */
export function isResponse(value: unknown): value is Response {
  return Object.prototype.toString.call(value) === "[object Response]";
}
