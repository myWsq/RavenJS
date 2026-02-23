---
name: raven-check-update
description: 检查 ravenjs 是否有更新。使用当用户询问是否有新版本时。
license: MIT
compatibility: Requires RavenJS to be installed first.
metadata:
  author: ravenjs
  version: "2.0"
---

# RavenJS Check Update Skill

检查 ravenjs 是否有更新可用。

**何时使用**：
- 用户问"ravenjs 有更新吗"
- 用户问"最新版本是什么"
- 定期检查（每周/每月一次）

**不使用时**：
- 项目还未安装 RavenJS
- 用户只是想写代码，不关心更新

**Steps**

1. **检查项目状态**：运行 `raven status` 检查是否已安装（输出为 JSON）。解析 JSON，若未安装，先建议使用 raven-install。
2. **检查更新**：从 status 输出中获取当前版本（version）和最新版本（latestVersion）信息。
3. **分析结果**：
   - 如果有更新，告诉用户新版本是什么
   - 如果用户有修改过代码（通过 fileHashes 判断），提醒用户需要智能合并
   - 如果没有更新，告诉用户已经是最新版本
4. **建议下一步**：
   - 如果有更新且用户未修改：建议使用 raven-merge SKILL 直接覆盖
   - 如果有更新且用户已修改：建议使用 raven-merge SKILL 智能合并
   - 如果没有更新：告诉用户已经是最新版本

**Guardrails**
- 必须先运行 raven status 检查安装状态
- 如果用户有修改过代码，一定要提醒他们
- 不要自动更新，只做检查和建议
- 从 CLI 的 JSON 输出中解析版本信息，不要硬编码
- 除了 `raven init` 外，所有命令默认输出 JSON
