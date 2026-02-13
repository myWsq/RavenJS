# runtime-abstraction Specification

## Purpose
该规范定义了 Raven 框架如何适配不同的 JavaScript 运行时（如 Bun, Node.js），提供统一的服务器抽象接口。

## Requirements

### Requirement: 运行时抽象层
Raven 框架 SHALL 提供一个抽象层，用于屏蔽不同运行时（Bun, Node.js）之间的差异。

#### Scenario: 成功检测 Bun 环境
- **WHEN** 框架在 Bun 运行时下启动
- **THEN** 框架检测到环境为 Bun
- **AND** 优先使用 Bun 原生 API（如 `Bun.serve`）

#### Scenario: 成功检测 Node.js 环境
- **WHEN** 框架在 Node.js 运行时下启动
- **THEN** 框架检测到环境为 Node.js
- **AND** 使用 Node.js 兼容的实现（如 `node:http`）
