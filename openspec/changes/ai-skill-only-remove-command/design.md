## Context

packages/ai 当前为每个能力（install、add）提供 skill.md 与 command.md 两套文档。两者内容重叠：skill 描述「何时使用」与「不使用时」，command 描述 Steps、Input、Output、Guardrails。raven init 将两者分别安装到 `.claude/skills/` 与 `.claude/commands/`。维护两套易不一致，且 Claude/Cursor 的 skill 机制已足够表达执行逻辑。

## Goals / Non-Goals

**Goals:**
- 移除 command 概念，只保留 skill
- packages/ai 仅含 skill.md，不再含 command.md
- raven init 只安装到 `.claude/skills/`，不再安装到 `.claude/commands/`
- 将 command 中有价值的内容（Steps、Guardrails）合并进 skill（如内容不足）

**Non-Goals:**
- 不改变 raven init/update 的 CLI 接口
- 不改变 registry 的 agent 结构与 mapping 语义
- 不新增 Cursor 等其他 agent 的 mapping（仅修改 claude mapping 内容）

## Decisions

1. **删除 command 文件**
   - 删除 `packages/ai/install/command.md`、`packages/ai/add/command.md`
   - Alternative: 保留文件但设为空/ deprecated — rejected，增加噪音

2. **合并 command 内容到 skill**
   - install/skill.md 当前已含「何时使用」「不使用时」。add/skill.md 同理。command 中的 Steps（检查项目状态、执行安装等）可补充到 skill 的正文，使 skill 自包含。
   - 具体：在 skill 中加入简洁的「Steps」段落，参考 command 的流程；Guardrails 可并入「不使用时」或单独一小节。

3. **更新 packages/ai/package.json**
   - 移除 `claude` mapping 中 command 相关条目：`add/command.md`、`install/command.md`
   - 保留 `add/skill.md`、`install/skill.md` 的 mapping

4. **CLI 行为**
   - `downloadAiResources` 照旧从 `ai.claude` 读取； mapping 减少后，自动只复制 skill 文件
   - 无需修改 `downloadAiResources` 逻辑

5. **已安装 .claude/commands/ 的处理**
   - `raven update` 不会删除用户已有的 `.claude/commands/`
   - 不再向 `.claude/commands/` 写入新文件；旧文件保留但不再更新
   - 可选：在 release notes 或文档中建议用户手动删除 `.claude/commands/raven/` 若不再需要

## Risks / Trade-offs

- **[Breaking] 依赖 /raven:install 或 /raven:add 的用户** → 改为依赖 skill 自动识别。若用户文档或 workflow 硬编码了 command 名称，需更新。Mitigation: 在 release notes 中说明迁移。
- **Skill 内容是否足够** → 若合并后仍缺执行细节，可在后续迭代补充。

## Migration Plan

1. 更新 install/skill.md、add/skill.md：补充 command 中的 Steps、Guardrails
2. 删除 install/command.md、add/command.md
3. 更新 packages/ai/package.json：从 claude mapping 移除 command 条目
4. 运行 `bun run generate-registry`  regenerate registry.json
5. 测试 raven init、raven update 在全新目录与已有 .claude/ 目录下的行为
