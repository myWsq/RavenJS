## Context

当前 AI skills 和 commands 位于 `packages/cli/templates/`，registry 将其作为 `modules.ai-skills` 描述，与框架模块（core、jtd-validator）混在一起。CLI 针对 ai-skills 有特殊分支逻辑（templates 路径优先、update 时的特殊顺序）。提取为独立 packages/ai 并在 registry 顶层增加 `ai` 属性，可分离关注点，便于后续扩展。

## Goals / Non-Goals

**Goals:**

- 创建 `packages/ai` 作为独立 package，包含 skills 和 commands
- Registry 增加顶级 `ai` 属性，与 `modules` 并列
- 从 `modules` 移除 ai-skills，CLI 统一从 `registry.ai` 消费
- 更新 generate-registry 以扫描 packages/ai 生成 ai 字段

**Non-Goals:**

- 改变 AI 资源安装到 .claude/ 的行为
- 改变 raven init / update 命令的对外接口
- 为 packages/ai 增加运行时逻辑（仅静态资源）

## Decisions

1. **packages/ai 目录结构**
   - `packages/ai/skills/`、`packages/ai/commands/` 与现 templates 结构对应
   - package.json 使用 `files` 列出 skills 和 commands，供 generate-registry 扫描
   - Alternative: 保留在 cli 内，仅调整 registry 结构 — rejected，与「独立模块」目标不符

2. **Registry `ai` 字段结构**
   - 与 modules 中单模块类似：`{ files: string[], fileMapping?: Record<string, string> }`
   - 无 `dependencies`（AI 资源为静态文件）
   - Alternative: 嵌套 `ai.skills` 与 `ai.commands` — 增加复杂度，单层 files + fileMapping 足够

3. **generate-registry 行为**
   - 扫描 `packages/ai` 的 package.json 的 `files`，生成 ai 对象
   - 继续扫描 `modules/` 生成 modules，不再包含 ai-skills
   - ai 与 modules 共用同一 version

4. **CLI 下载路径**
   - 远程：`packages/cli/templates/` → `packages/ai/`（GitHub raw 路径改为 `packages/ai/`）
   - 本地 source：`packages/ai/` 作为 AI 资源的来源

## Risks / Trade-offs

- **[Breaking] 已发布版本的 registry 无 `ai` 字段** → 新版本与旧 registry 不兼容；CLI 需在读取时兼容缺失 `ai`（向后兼容窗口）或要求最低 registry 版本。
- **GitHub release 资源路径** → Release 需包含 `packages/ai/` 目录，CI 构建脚本需纳入。
- **workspace 变更** → 根 package.json 需加入 `packages/ai`，可能影响 monorepo 工具链。

## Migration Plan

1. 创建 `packages/ai/`，迁移 templates 内容
2. 更新 `generate-registry.ts`，输出 `ai` 字段，modules 不再含 ai-skills
3. 更新 CLI 消费 `registry.ai`，移除 ai-skills 相关分支
4. 删除 `packages/cli/templates/`
5. 更新 workspace、CI 等配置
6. 若需向后兼容：CLI 在 `!registry.ai` 时退化为 `registry.modules['ai-skills']` 或报错提示升级
