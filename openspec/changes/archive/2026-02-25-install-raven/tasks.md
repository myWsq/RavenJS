## 1. Package and CLI Entry

- [x] 1.1 在 monorepo 中新增包 `packages/install-raven`，包含 `package.json`（name、bin 指向入口）、`index.ts` 或 `main.ts` 作为入口
- [x] 1.2 实现 CLI 入口：解析无参数或 `--help` / `--target <dir>`，调用主逻辑并正确退出码
- [x] 1.3 将 `packages/install-raven` 加入 workspace（若使用 root workspaces），确保 `bun install` 可解析

## 2. Skill Source and Mapping

- [x] 2.1 实现从「AI 资源源」读取 skill 文件与映射：本地开发时从 `packages/ai` 读取，使用与 `packages/ai/package.json` 的 `claude` 字段一致的 sourcePath → destPath 映射
- [x] 2.2 支持默认目标根目录为 `.claude/skills`，以及通过 `--target <dir>` 或环境变量覆盖；解析后得到每个文件的绝对目标路径
- [x] 2.3 将 source 路径解析与映射逻辑放在单一入口（如 main.ts）的清晰 section 中，便于后续从 npm/GitHub 发布产物读取时复用

## 3. Copy Skills to Target

- [x] 3.1 按映射将每个 source 文件复制到目标路径，目标目录不存在时创建；目标文件名为 destPath 最后一段（如 `SKILL.md`），与现有 raven init 行为一致
- [x] 3.2 实现幂等：再次执行时覆盖已存在的 skill 文件，不报错，退出码 0 并输出成功信息
- [x] 3.3 复制过程中出错时（如源文件缺失、写入失败）输出明确错误信息并非零退出

## 4. raven-setup Skill Documentation

- [x] 4.1 在 `packages/ai/raven-setup/skill.md` 中明确：当 `bunx raven` 不可用时，Agent 应在当前项目中执行 `bun add -d @raven.js/cli`，再继续执行 `raven init`、添加 core 及配置校验，使用户在仅安装 Skill 后即可通过 raven-setup 完成全流程
- [x] 4.2 确保 raven-setup 的 Step 0（或等价章节）不要求用户事先已安装 @raven.js/cli 或已运行 raven init

## 5. Remove Skill installation from @raven.js/cli

- [x] 5.1 从 `raven init` 实现中移除：读取 registry `ai`、创建或写入 `.claude/skills/`、以及 `--source` 用于 AI 资源源的逻辑；保证 init 仅创建 raven 根目录与 `raven.yaml`
- [x] 5.2 从 `raven update` 实现中移除：更新 `.claude/skills/` 或任何 AI 资源的逻辑；保证 update 仅更新 `raven/` 下模块及 `raven.yaml`
- [x] 5.3 更新主 CLI 文档与完成文案：说明 Skill 请使用 install-raven 安装；raven init 完成时不再提及 .claude/skills/
- [x] 5.4 调整或移除与「CLI 安装/更新 Skill」相关的测试与快照，确保通过

## 6. Help and Tests

- [x] 6.1 实现 `install-raven --help`，输出中说明默认目标目录及 `--target <dir>` 用法
- [x] 6.2 在 `packages/install-raven/tests/` 增加单元或集成测试：默认目标安装、`--target` 覆盖、幂等重跑、源缺失或目标不可写时的错误行为（至少覆盖核心场景）
