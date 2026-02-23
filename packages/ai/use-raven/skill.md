---
name: raven-use
description: |
  当 Agent 需要使用 RavenJS 框架编写代码时自动调用。

  触发场景（Agent 应通过此 description 自主识别并调用）：
  - 用户要求创建 HTTP 服务
  - 需要定义路由、处理函数
  - 使用中间件/hooks
  - 数据验证逻辑
  - 状态管理
  - 任何涉及 ravenjs 框架的代码编写任务

  此 skill 会：
  1. 检查项目是否已初始化（raven 根目录是否存在）
  2. 获取已安装模块列表
  3. 获取所有可用模块及其描述
  4. 根据用户需求匹配模块描述，找到需要学习的模块
  5. 调用 raven guide <module> 获取相关代码模式
  6. 提供具体的代码示例和最佳实践

  注意：不处理安装、更新等运维任务（请使用独立的 Command 型 skill）。
---

# RavenJS Use Skill

教 Agent 如何使用 RavenJS 框架编写代码。

## 何时使用

Agent 应该在以下情况自动调用此 skill：
- 用户说"帮我用 ravenjs 写个服务"
- 用户说"添加一个 API 路由"
- 用户要求数据验证
- 用户询问如何使用 ravenjs 的某个功能
- 任何需要用 ravenjs 框架编写代码的场景

## 何时不使用

- 用户只是想了解 ravenjs 是什么（使用 raven-learn）
- 用户想安装 ravenjs（使用 raven-install）
- 用户想更新 ravenjs（使用 raven-merge）
- 项目未初始化（先提示用户运行 raven init）

## Steps

### 1. 检查项目初始化状态

运行 `raven status`（JSON 输出）检查项目是否已初始化。

从 JSON 输出中检查：
- 如果返回错误或 `ravenDir` 不存在 → 提示用户先运行 `raven init`
- 如果返回正常 → 继续

### 2. 获取已安装模块

从 `raven status` 输出的 `modules` 数组中，解析已安装的模块列表。

### 3. 获取所有可用模块

运行 `raven fetch`（JSON 输出）获取 registry 中的所有可用模块。

从输出中解析：
- `modules` 对象：每个模块的详细信息
- 每个模块包含 `description` 字段，描述模块的用途

### 4. 根据用户需求匹配模块

分析用户想要实现的功能，匹配对应的模块：

- 用户想要创建 HTTP 服务 → 需要 core
- 用户想要定义路由 → 需要 core
- 用户想要处理请求 → 需要 core
- 用户想要数据验证 → 需要 jtd-validator

**模块 description 匹配逻辑**：
- 读取每个模块的 description
- 根据用户需求中的关键词（如"验证"、"路由"、"服务"）匹配
- 选择最相关的模块

### 5. 加载模块知识

对于需要学习的每个模块，运行 `raven guide <module-name>`。

`guide` 输出格式：
```
<readme>
README.md 内容
</readme>

<code>
文件: path/to/file.ts
```typescript
代码内容
```
</code>
```

### 6. 提供代码模式

从 guide 输出中提取：
- 推荐的代码结构
- 关键 API 使用方式
- 设计意图

### 7. 伴随式指导

在 Agent 编写代码的过程中：
- 随时回答关于 ravenjs API 的问题
- 指出可能的设计问题
- 提供最佳实践建议

## Ref 参考

如需更详细的操作指南，可加载同级目录下的 ref 文件：

- [添加新模块](./refs/add-new-module.md) - 如何使用 raven add 添加模块
- [学习模块知识](./refs/learn-module.md) - 如何使用 raven guide 学习模块
- [核心代码模式](./refs/core-patterns.md) - core 模块的代码模式
- [验证使用方式](./refs/validation.md) - jtd-validator 使用指南

## Guardrails

- 必须先运行 `raven status` 确认项目已初始化
- 如果需要某个未安装的模块，提示用户先运行 `raven add <module>`
- 所有 CLI 命令输出 JSON（guide 除外），直接解析即可
- guide 输出是 Markdown 格式，需要正确解析 `<readme>` 和 `<code>` 标签
- 不提供安装、升级等运维指导（那是 Command 型 skill 的职责）
- 不要硬编码模块列表，始终从 registry 动态获取
