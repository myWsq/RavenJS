## Why

CLI 当前设计存在以下问题：init 与 install 职责重叠，core 被特殊对待，registry 缺少模块依赖信息，status 仅展示已安装模块，add 不处理依赖。重构后，init 专注 AI 资源与项目根目录初始化，模块（含 core）统一通过 add 安装，registry 显式描述模块依赖，status 展示全部模块并用 installed 区分，add 自动补齐依赖。

## What Changes

- **init 命令重构**：只做两件事 —— 安装 AI Resource、初始化 raven 根目录（创建目录和 raven.yml）。重复运行 init 时，若 raven 根目录已存在且 raven.yml 存在，则跳过根目录更新，只更新 AI Resource。**BREAKING**: init 不再安装 core 模块。
- **移除 install 命令**：**BREAKING** 删除 `raven install`。用户需通过 `raven add core` 安装 core 模块，skill 亦可使用 add 命令。
- **registry.json 结构调整**：core 不再作为顶层独立概念，与其他模块同级存放在 `modules` 中。registry 增加 `dependsOn` 等字段描述模块间依赖（如 jtd-validator 依赖 core）。
- **generate-registry 脚本**：生成 registry 时解析各模块 package.json 的 dependencies/devDependencies，识别对 @ravenjs/* 的引用，自动填充模块依赖关系。
- **status 命令**：展示 registry 中所有模块，用 `installed` 字段区分是否已安装。
- **add 命令**：添加模块前检查其依赖，若依赖模块未安装则先安装依赖模块（递归处理）。拉取模块文件后，将源码中的 `@ravenjs/<module>` import 替换为相对路径（如 `../core`），以适配用户 raven 根目录无 package.json 的目录结构。

## Capabilities

### New Capabilities

- `cli-init-refactor`: init 命令新行为（AI Resource + 根目录初始化，幂等、跳过已有根目录，不装 core）
- `cli-registry-deps`: registry 中模块依赖描述及 generate-registry 解析逻辑
- `cli-status-all-modules`: status 展示所有模块并用 installed 区分
- `cli-add-deps`: add 命令自动安装依赖模块

### Modified Capabilities

- `cli-tool`: 移除 install 命令；init 不再安装 core；status 输出结构变更；add 支持依赖解析

## Impact

- `packages/cli/index.ts`: init、add、status 逻辑及 install 移除
- `packages/cli/scripts/generate-registry.ts`: 解析 @ravenjs/* 依赖，输出 dependsOn
- `packages/cli/registry.json`: 模块结构增加 dependsOn
- `packages/ai/` 下 skill 文件：raven-install skill 需改为使用 add core；raven-add skill 可能需更新以反映依赖行为
- 所有依赖 `raven install` 的文档、测试、CI 需改为 `raven init` + `raven add core`
- downloadModule/复制逻辑：写入文件前对 `@ravenjs/*` import 进行相对路径替换
