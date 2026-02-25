## Context

当前用户需先执行 `bun add -d @raven.js/cli` 与 `bunx raven init` 才能在 Agent 中使用 raven-setup，步骤多、入口分散。现有 AI 资源位于 `packages/ai/`，通过 `package.json` 的 `claude` 字段描述 sourcePath → destPath 的映射；主 CLI（`@raven.js/cli`）的 `raven init` 会安装这些 Skill 并创建 raven 根目录。本变更引入一个职责单一的「只装 Skill」CLI，与主 CLI 解耦：不依赖已安装的 @raven.js/cli，不创建 raven 目录，仅把 Skill 写入项目约定目录，后续由 raven-setup 在项目中安装 @raven.js/cli 并完成初始化。

## Goals / Non-Goals

**Goals:**
- 提供独立可执行入口（如 `npx install-raven` 或全局 `install-raven`），仅将 RavenJS Skill 安装到当前项目的 `.claude/skills/`（或可配置目录）。
- Skill 来源与现有 `packages/ai` 及 registry 的 ai 映射一致，复用同一套 source→dest 定义，便于本地开发与发布一致。
- 明确 raven-setup 的契约：在项目中安装 `@raven.js/cli` 并执行后续 init/add core/校验，文档化在 Skill 内即可。
- **从 @raven.js/cli 中移除创建/安装 Skill 的能力**：`raven init` 只创建 raven 根目录与 `raven.yaml`，不再向 `.claude/skills/` 写入任何内容；`raven update` 只更新框架模块，不再更新 AI 资源；Skill 的安装与更新由 install-raven 单一入口负责。

**Non-Goals:**
- 不在此变更中发布独立 npm 包名（可后续决定是独立包还是 monorepo 内子包 + bin）。

## Decisions

1. **install-raven 与主 CLI 的边界**  
   install-raven 只做「从某处读取 AI 资源 + 按映射写入目标目录」。不读取 registry、不创建 raven 根目录、不安装 npm 依赖。这样用户可在未安装 @raven.js/cli 的前提下先拿到 Skill，再在 Agent 里用 raven-setup 装 CLI 并完成后续步骤。  
   **备选**：让主 CLI 增加 `raven init --skills-only`。否决原因：用户仍需先安装 @raven.js/cli 才能执行，无法实现「零依赖先装 Skill」的简化流程。

2. **Skill 来源与映射**  
   复用 `packages/ai/package.json` 的 `claude` 映射（或与现有 registry ai 结构对齐的同一份映射）。本地开发时从 workspace `packages/ai/` 读取；发布后可从 npm 包或 GitHub 发布产物中解出同一套文件。实现时通过单一「映射 + 源目录/包」抽象，避免重复维护两套路径。  
   **备选**：单独维护一份 install-raven 专用映射。否决原因：易与 packages/ai 不同步，增加维护成本。

3. **目标目录与文件名**  
   默认写入 `.claude/skills/`，每个 skill 对应子目录，文件名为 `SKILL.md`（与现有 raven init 行为一致）。支持通过选项（如 `--target` 或环境变量）覆盖目标根目录，便于测试或非标准布局。  
   **备选**：固定 .cursor 等多 agent 目录。否决原因：本变更先覆盖 Claude/.claude 场景，其他 agent 可后续扩展。

4. **包与入口形式**  
   在 monorepo 内新增包（如 `packages/install-raven`），提供 bin 入口；是否单独发布为 `install-raven` 或 `@raven.js/install-raven` 留作发布策略，不阻塞实现。  
   **备选**：直接在主 CLI 中加子命令。否决原因：与「不依赖已安装 @raven.js/cli」目标冲突。

5. **主 CLI 不再安装/更新 Skill**  
   `raven init` 与 `raven update` 中所有与「读取 registry ai、拷贝/更新 .claude/skills/」相关的逻辑移除；`raven init --source` 因仅用于 AI 资源源，一并移除。registry 的 `ai` 字段可保留供 install-raven 或文档使用，主 CLI 不再依赖。  
   **备选**：保留 raven init 的 --skills-only 与默认「同时装 skill」。否决原因：与「单一入口 install-raven」及「零依赖先装 Skill」目标一致，避免两处安装逻辑并存。

## Risks / Trade-offs

- **迁移体验**：已习惯「raven init 顺带装 Skill」的用户需改为先运行 install-raven（或先装 Skill）再 raven init。缓解：在 README 与 raven init 完成文案中说明「Skill 请使用 install-raven 安装」。
- **版本一致**：install-raven 安装的 Skill 版本与后续 raven-setup 安装的 @raven.js/cli 版本可能不同步。缓解：文档建议「安装 Skill 后尽快在 Agent 中执行 raven-setup」，并在 raven-setup 中保留「先装 CLI 再 init」的步骤，由 CLI 保证资源与版本一致。
- **发布与发现**：若独立发布，需在 README/官网明确推荐「第一次用可运行 npx install-raven，再在 Agent 里 raven-setup」；现有「bun add -d @raven.js/cli && bunx raven init」仍保留为可选路径。
