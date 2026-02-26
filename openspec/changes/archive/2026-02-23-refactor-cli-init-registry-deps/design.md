## Context

当前 CLI 中：`raven init` 仅安装 AI 资源；`raven install` 创建 raven 根目录并安装 core；`raven add` 不解析模块依赖；`raven status` 仅展示已安装模块，且将 core 单独列出。registry.json 的 modules 中虽有 core，但 generate-registry 未解析 @ravenjs/\* 的依赖关系。用户要求：不考虑向后兼容，统一 init 职责、移除 install、registry 显式依赖、status 全量展示、add 自动安装依赖。

## Goals / Non-Goals

**Goals:**

- init 负责 AI Resource + raven 根目录初始化；重复 init 时若根目录与 raven.yml 已存在则仅更新 AI Resource
- 移除 install 命令，core 通过 add 安装
- registry 中每个模块增加 dependsOn（字符串数组），generate-registry 从 package.json 解析 @ravenjs/\* 依赖
- status 输出所有 registry 模块，每项带 installed
- add 在安装目标模块前递归安装未安装的依赖

**Non-Goals:**

- 不处理版本冲突或依赖循环的复杂解析
- 不引入新的外部包管理（仍为文件复制）
- 不迁移现有项目数据（breaking change，用户需按新流程操作）

## Decisions

### 1. init 幂等逻辑

- **决策**：若 `raven/` 存在且 `raven/raven.yml` 存在，则跳过创建/更新根目录和 raven.yml，仅执行 AI Resource 下载。
- **理由**：避免覆盖用户已有配置，同时保证重复 init 可安全更新 AI 资源。
- **替代**：始终覆盖 raven.yml —— 会破坏用户自定义， rejected。

### 2. dependsOn 字段格式

- **决策**：在 registry 每个模块下增加 `dependsOn: string[]`，值为模块名（如 `["core"]`）。仅包含 @ravenjs/\* 工作区依赖，不包含外部 npm 包。
- **理由**：简洁且足够表达模块间依赖；generate-registry 可从 package.json 的 dependencies/devDependencies 中提取 `@ravenjs/core` → `core`。
- **替代**：使用对象 `{ "core": "workspace:*" }` —— 过度复杂，当前需求只需模块名列表。

### 3. add 依赖安装顺序

- **决策**：拓扑排序依赖后按顺序安装；若存在循环依赖则报错。
- **理由**：保证依赖先于被依赖模块安装。
- **替代**：并行安装 —— 可能违反依赖顺序，rejected。

### 4. status 输出结构

- **决策**：输出 `modules: Array<{ name: string; installed: boolean }>`，覆盖 registry 中所有模块，按 name 排序。
- **理由**：与「展示所有模块，用 installed 区分」一致；移除顶层 `core` 字段，core 作为普通模块出现在 modules 中。
- **替代**：保留 `core` 与 `modules` 分开 —— 违背「core 与其他模块同级」的目标。

### 5. ensureRavenInstalled 与 add 前置条件

- **决策**：`raven add` 前必须存在 raven 根目录和 raven.yml。若不存在，提示先运行 `raven init`。
- **理由**：init 负责创建根目录，add 只负责安装模块。
- **替代**：add 自动创建根目录 —— 会混淆 init 与 add 职责。

### 6. raven-install skill 迁移

- **决策**：将 raven-install skill 改为执行 `raven init` 后 `raven add core`（或合并为明确的两步指引）。
- **理由**：install 被移除，install skill 需要新的等效流程。

### 7. @ravenjs/\* import 路径替换

- **决策**：CLI 在拉取/复制模块文件并写入用户项目前，对文件内容进行替换：将 `from "@ravenjs/<module>"` 或 `from '@ravenjs/<module>'` 替换为 `from "../<module>"`（或正确的相对路径）。替换时根据当前文件在 raven 根目录下的位置计算到目标模块目录的相对路径。
- **理由**：monorepo 源码使用包名 `@ravenjs/core`，但用户的 raven 根目录仅为普通目录，无 package.json、无 node_modules，需使用相对路径才能正确解析。
- **替代**：要求用户配置 path mapping 或修改 tsconfig —— 增加用户负担，rejected。

## Risks / Trade-offs

- **[Risk] 用户习惯 `raven install` 一键安装** → 文档和 skill 明确说明：先 `raven init`，再 `raven add core`；可选提供简短 migration 说明。
- **[Risk] 依赖循环** → generate-registry 和 add 检测循环并报错，避免无限递归。
- **[Risk] 旧版 registry 无 dependsOn** → 生成脚本始终输出 dependsOn，旧文件会被覆盖；若手动编辑则需保证格式正确。

## Migration Plan

1. 更新 generate-registry，输出 dependsOn
2. 更新 registry.json（重新生成）
3. 重构 index.ts：init 新逻辑、移除 install、status 新结构、add 依赖解析
4. 更新 raven-install、raven-add skill
5. 更新测试与 CI：将 `raven install` 替换为 `raven init` + `raven add core`
6. 发布时为 major 或注明 breaking changes
