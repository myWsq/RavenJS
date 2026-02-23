---
name: raven-add
description: 向 RavenJS 项目添加模块（core, jtd-validator 等）。使用当用户想要扩展 RavenJS 功能时。
license: MIT
compatibility: Requires RavenJS to be initialized first.
metadata:
  author: ravenjs
  version: "2.0"
---

# RavenJS Add Skill

向已初始化的 RavenJS 项目添加模块。

**何时使用**：
- 用户说"添加 jtd-validator"
- 用户说"我需要验证功能"
- 用户想要添加某个 RavenJS 模块

**不使用时**：
- 项目还未初始化 RavenJS：先运行 `raven status`，若 raven 根目录不存在则先建议 `raven init`，再 `raven add core`
- 用户不知道要添加什么模块（先询问）

**Steps**

1. **检查项目状态**：运行 `raven status` 获取安装状态（输出为 JSON）。解析 `modules` 数组，若所有模块的 `installed` 均为 false，先建议 `raven init` 创建根目录，再 `raven add core`。
2. **获取可用模块**：运行 `raven fetch` 获取 registry 中的可用模块列表（输出为 JSON）。
3. **确定要添加的模块**：用户明确说模块名则直接使用；描述功能则推断对应模块；不确定则用 **AskUserQuestion** 询问（从 fetch 输出的 modules 数组中获取可用模块列表）。
4. **执行添加**：运行 `raven add <module-name>`。
5. **验证添加**：从 add 命令的 JSON 输出中读取 modifiedFiles，确认模块已正确添加，并显示该模块的 README。
6. **后续步骤**：根据添加的模块，给出使用建议。

**Guardrails**
- 必须在已初始化 RavenJS 的项目中使用（先 `raven init` 创建根目录）
- 只能添加从 `raven fetch` 获取的 modules 数组中列出的模块
- `raven add` 会自动安装目标模块的依赖（如 jtd-validator 依赖 core，会先安装 core）
- 始终从 CLI 的 JSON 输出中解析信息，不要硬编码模块列表或路径
- 除了 `raven init` 外，所有命令默认输出 JSON，无需添加 `--json` 参数
