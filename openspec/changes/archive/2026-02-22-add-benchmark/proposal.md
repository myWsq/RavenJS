## Why

RavenJS 作为高性能 Web 框架需要一套完整的性能基准测试套件，用于衡量核心组件性能、跟踪性能回归、以及与同类框架进行横向对比。当前缺乏系统化的性能测试能力，难以量化优化效果和发现潜在瓶颈。

## What Changes

- 新建 `benchmark/` 目录，包含完整的性能测试基础设施
- 实现针对核心组件的 micro-benchmark：路由匹配、Schema 验证、State 操作
- 实现端到端的 HTTP 请求吞吐量测试
- 提供性能对比脚本，可与 Hono、Elysia 等框架横向比较
- 集成 Bun 原生 `bench` API，确保测试结果准确可靠

## Capabilities

### New Capabilities

- `performance-benchmark`: 性能基准测试套件，包含 micro-benchmark 和端到端测试，支持多框架对比

### Modified Capabilities

（无需修改现有规格）

## Impact

- 新增 `benchmark/` 目录及测试脚本
- `package.json` 新增 benchmark 相关脚本命令
- 可能需要添加 `tinybench` 或使用 Bun 原生 bench 作为测试依赖
- 不影响核心代码，仅新增测试基础设施
