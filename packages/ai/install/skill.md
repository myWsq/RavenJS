---
name: raven-install
description: 在当前项目中安装 RavenJS 参考代码。使用当用户想要开始使用 RavenJS 风格构建 Web 应用时。
license: MIT
compatibility: Requires Bun or Node.js runtime.
metadata:
  author: ravenjs
  version: "2.0"
---

# RavenJS Install Skill

在当前项目中安装 RavenJS 参考代码（不是作为依赖，而是作为可修改的代码）。

**何时使用**：
- 用户说"我想使用 RavenJS"
- 用户说"安装 RavenJS"
- 用户说"初始化一个 RavenJS 项目"
- 用户想要创建一个新的 Web 服务

**不使用时**：
- 项目已经初始化过 RavenJS：先运行 `raven status` 检查安装状态，若已安装则跳过
- 用户只是想问问题，不想实际安装

**Steps**

1. **检查项目状态**：运行 `raven status` 获取安装状态（输出为 JSON）。解析 JSON，若已安装，提示用户并询问是否要重新安装或继续。
2. **确认安装**：如果未安装，使用 **AskUserQuestion** 确认（"即将在当前目录安装 RavenJS 参考代码。这些代码将是可修改的。是否继续？"）。
3. **执行安装**：运行 `raven install`。
4. **验证安装**：从 install 命令的 JSON 输出中读取 modifiedFiles，确认模块已正确添加，并列出安装的内容。
5. **学习代码**：（可选）如果用户需要，使用 raven-learn SKILL 帮助用户理解代码。
6. **下一步建议**：告诉用户代码已经在安装目录中（从 modifiedFiles 中获取路径），可以直接修改使用。

**Guardrails**
- 不要覆盖已有的安装目录，除非用户明确确认
- 如果 raven 命令不可用，提示用户先安装 RavenJS CLI
- 告诉用户这是参考代码，可以自由修改
- 从 CLI 的 JSON 输出中解析信息，不要硬编码 `raven/` 路径
- 除了 `raven init` 外，所有命令默认输出 JSON

