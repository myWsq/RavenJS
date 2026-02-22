---
name: raven-add
description: 向 RavenJS 项目添加模块（core, jtd-validator 等）。使用当用户想要扩展 RavenJS 功能时。
license: MIT
compatibility: Requires RavenJS to be initialized first.
metadata:
  author: ravenjs
  version: "1.0"
---

# RavenJS Add Skill

向已初始化的 RavenJS 项目添加模块。

**何时使用**：
- 用户说"添加 jtd-validator"
- 用户说"我需要验证功能"
- 用户想要添加某个 RavenJS 模块

**可用模块**：
- `core` - 核心框架（默认已安装）
- `jtd-validator` - JTD 数据验证

**不使用时**：
- 项目还未初始化 RavenJS：先运行 `raven status` 或 `raven status --json`，若 core 未安装则先建议 `raven install`
- 用户不知道要添加什么模块（先询问）
