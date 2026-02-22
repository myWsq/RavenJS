## 1. 更新 Skill 内容

- [x] 1.1 在 install/skill.md 中补充 Steps（检查项目状态、确认安装、执行 raven install、验证、下一步建议）与 Guardrails
- [x] 1.2 在 add/skill.md 中补充 Steps（检查状态、确定模块、执行 raven add、验证、后续步骤）与 Guardrails

## 2. 移除 Command 文件

- [x] 2.1 删除 packages/ai/install/command.md
- [x] 2.2 删除 packages/ai/add/command.md

## 3. 更新 Registry 配置

- [x] 3.1 更新 packages/ai/package.json：从 claude mapping 移除 add/command.md、install/command.md 条目
- [x] 3.2 执行 `bun run generate-registry` regenerate registry.json

## 4. 验证

- [x] 4.1 测试 raven init 在全新目录：仅安装 skills 到 .claude/skills/，不创建 .claude/commands/
- [x] 4.2 测试 raven update 在已有 .claude/ 目录：只更新 skills，不向 commands 写入
