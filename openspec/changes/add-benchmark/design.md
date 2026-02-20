## Context

RavenJS 是一个基于 Bun 的高性能 TypeScript Web 框架，核心组件包括 RadixRouter 路由匹配、JTD Schema 验证、State 管理和 Hook 系统。当前缺乏系统化的性能测试能力，无法量化各组件的性能表现和追踪性能回归。

项目使用 monorepo 结构，主要代码在 `packages/core/main.ts` 中以 section 形式组织。需要在根目录新建 `benchmark/` 目录存放测试代码。

## Goals / Non-Goals

**Goals:**

- 建立可重复执行的性能基准测试套件
- 覆盖核心组件：路由匹配、Schema 验证、State 操作、请求处理
- 支持与 Hono、Elysia 等同类框架的横向对比
- 提供清晰的性能指标输出（ops/sec、延迟分布）

**Non-Goals:**

- 不实现持续性能监控或报警系统
- 不集成到 CI/CD 流程（可后续扩展）
- 不测试 NodeAdapter（专注于 Bun 环境性能）

## Decisions

### 1. 使用 Bun 原生 bench API 而非 tinybench

**理由**：Bun 内置 `bench` API 与运行时深度集成，无需额外依赖，且能准确测量 Bun 特有优化（如 JIT 编译、内存分配）。

**备选方案**：tinybench 跨平台兼容性更好，但引入额外依赖且无法利用 Bun 原生优化。

### 2. 分层测试架构：micro-benchmark + e2e-benchmark

**理由**：
- micro-benchmark 隔离测试单个组件（Router、Validator），定位瓶颈
- e2e-benchmark 测试完整请求链路，反映真实场景性能

**结构**：
```
benchmark/
  micro/
    router.bench.ts      # RadixRouter 匹配性能
    validator.bench.ts   # JTD Schema 验证性能
    state.bench.ts       # AppState/RequestState 操作
  e2e/
    throughput.bench.ts  # HTTP 请求吞吐量
  compare/
    frameworks.bench.ts  # 多框架对比测试
```

### 3. 对比框架选择：Hono 和 Elysia

**理由**：
- Hono：轻量级，广泛使用，适合作为基准参照
- Elysia：同为 Bun 原生框架，直接竞争对手

**实现**：对比测试作为可选脚本，需用户自行安装对比框架依赖。

### 4. 测试数据规模设计

| 测试项 | 数据规模 | 说明 |
|--------|----------|------|
| 路由匹配 | 100/1000/10000 路由 | 测试 Radix Tree 扩展性 |
| Schema 验证 | 简单/中等/复杂对象 | 测试 AJV/JTD 性能 |
| 请求吞吐 | 持续 10s | 统计 RPS 和延迟 |

## Risks / Trade-offs

**[Risk] Bun bench API 可能变化** → 锁定 Bun 版本，测试前检查 API 可用性

**[Risk] 对比框架版本影响结果** → 在测试报告中记录所有依赖版本

**[Trade-off] micro-benchmark 可能无法反映真实性能** → 结合 e2e 测试验证，micro 结果仅作参考

**[Trade-off] 对比测试增加维护成本** → 对比脚本独立于核心测试，可选执行
