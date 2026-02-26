## Why

在构建 Web 服务时，需要对请求的参数（body、query、params、headers）进行校验。当前缺乏一个统一的、基于 Schema 的参数校验解决方案，需要在每个 handler 中手动编写校验逻辑，导致代码重复且难以维护。使用 Standard Schema 可以实现黑盒校验，无需直接依赖某个具体的 schema 库。

## What Changes

- 新增 `plugin-validator` 模块，提供基于 Standard Schema 的参数校验能力
- 实现 `withSchema` 高阶函数，接收 schemas 配置和 handler，返回包装后的异步函数
- schemas 支持 `body`、`query`、`params`、`headers` 四个可选的 Standard Schema
- 校验失败时返回 400 状态码和详细的错误信息
- 校验成功时将解析后的参数传递给 handler 的 Context

## Capabilities

### New Capabilities

- `plugin-validator`: 提供基于 Standard Schema 的核心参数校验功能

### Modified Capabilities

- 无

## Impact

- 新增 `modules/plugin-validator` 目录
- 依赖 `modules/core/standard-schema` 模块
- 可被任何需要参数校验的 handler 使用
