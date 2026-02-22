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

**Steps**

1. **检查项目状态**：运行 `raven status` 或 `raven status --json` 获取安装状态。若 core 未安装，先建议使用 raven install。
2. **确定要添加的模块**：用户明确说模块名则直接使用；描述功能则推断对应模块；不确定则用 **AskUserQuestion** 询问（"你想添加哪个模块？可用模块：core, jtd-validator"）。
3. **执行添加**：运行 `raven add <module-name>`。
4. **验证添加**：检查 `raven/<module-name>/` 目录是否已创建，并显示该模块的 README。
5. **后续步骤**：根据添加的模块，给出使用建议。

**Guardrails**
- 必须在已初始化 RavenJS 的项目中使用
- 只能添加 registry 中列出的模块
- 如果模块已存在，提示用户并询问是否更新
