---
name: raven-install
description: 在当前项目中安装 RavenJS 框架。使用当用户想要开始使用 RavenJS 构建 Web 应用时。
license: MIT
compatibility: Requires Bun or Node.js runtime.
metadata:
  author: ravenjs
  version: "1.0"
---

# RavenJS Install Skill

在当前项目中安装并初始化 RavenJS 框架。

**何时使用**：
- 用户说"我想使用 RavenJS"
- 用户说"安装 RavenJS"
- 用户说"初始化一个 RavenJS 项目"
- 用户想要创建一个新的 Web 服务

**不使用时**：
- 项目已经初始化过 RavenJS：先运行 `raven status` 或 `raven status --json` 检查 core/modules 安装状态，若 core 已安装则跳过
- 用户只是想问问题，不想实际安装
