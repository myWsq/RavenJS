## Context

RavenJS CLI 已有 `install`、`init`、`add`、`update` 等命令。安装状态检测目前分散在 packages/ai 的 skill 和 command 中，通过硬编码「检查 raven/ 是否存在」等方式判断。registry 结构包含 `modules`（如 core、jtd-validator）与顶层 `ai`（.claude/ 下的 skills/commands）。root 可通过 `--root` 或 `RAVEN_ROOT` 指定，默认为 `raven`。

## Goals / Non-Goals

**Goals:**

- 提供 `raven status` 命令，统一输出 ai、core、modules 的安装状态
- 支持 `--json` 输出，便于 agent 解析
- 允许 skill/command 通过调用该命令动态判断，替代硬编码

**Non-Goals:**

- 不改变 install/init/add 的现有行为
- 不增加网络请求（纯本地检测）

## Decisions

### 1. 检测逻辑

- **core**：`<root>/core/` 存在且非空
- **modules**：列举 `<root>/` 下除 `core`、`raven.yaml` 外的子目录，对应 registry.modules 中的已安装模块

（不检测 .claude/ 等 AI 目录，仅关注 raven 根目录）

**Alternatives considered**：仅检查目录存在 vs 非空。选择非空，避免「空目录算已安装」的歧义。

### 2. 输出格式

- 默认：人类可读，如 `core: installed` / `modules: [jtd-validator]`
- `--json`：`{"core":{"installed":true},"modules":["jtd-validator"]}`

**Alternatives considered**：仅 JSON vs 仅文本。选择两者兼顾，默认文本便于用户，`--json` 便于 agent。

### 3. 实现位置

在 `packages/cli/index.ts` 中新增 `cmdStatus`，复用 `getRoot`、`pathExists`、`isDirEmpty`、`readdir` 等现有 helpers。

### 4. 退出码

- 0：命令正常执行（无论是否已安装）
- 1：仅在解析错误等异常时使用

**Rationale**：status 是查询命令，未安装不是错误，避免 agent 误判。

## Risks / Trade-offs

- [Risk] 检测逻辑与 install/init 的实际行为不一致 → Mitigation：复用与 install/init 相同的路径与空目录判定逻辑
- [Risk] JSON 格式变更影响已有 agent → Mitigation：首次引入，无兼容负担；将来变更需语义化版本或明确说明
