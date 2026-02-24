## Context

当前 `raven guide <module>` 实现于 `packages/cli/index.ts` 的 `cmdGuide`，逻辑为：列出 raven 目录下子目录作为可用模块，检查目标模块目录存在后，读取 README.md（若有）并递归收集所有源码文件，以 `<readme>`、`<code>` 等 XML 标签格式拼接输出。registry 由 `packages/cli/scripts/build.ts` 的 `scanModules` 生成，扫描 `modules/` 下各子目录的 package.json 和 git-tracked 文件，无 GUIDE.md 校验。

## Goals / Non-Goals

**Goals:**

- 将 guide 输出完全交由模块的 GUIDE.md 决定，CLI 只负责读文件并输出
- 在 registry 生成阶段强制校验每个模块存在 GUIDE.md，缺则报错
- 保持 guide 命令的接口不变（`raven guide <module>`），仅输出内容来源变化

**Non-Goals:**

- 不定义 GUIDE.md 的章节结构或 template（由各模块自由决定）
- 不改变 registry 的 JSON 结构（不新增 guidePath 等字段）
- 不处理 raven add 时如何拷贝 GUIDE.md（沿用现有 files 机制，GUIDE.md 需在 git-tracked 或 files 中）

## Decisions

**1. GUIDE.md 路径与校验时机**

- **决策**：GUIDE.md 位于 `modules/<name>/GUIDE.md`，在 `generateRegistry` 的 `scanModules` 阶段校验存在性。
- **理由**：与 README、package.json 同级，便于发现；在 registry 生成时校验，可避免发布/构建出无效 registry。
- **备选**：运行时校验——延迟到 `raven guide` 调用时才发现缺文件，用户体验差；且 registry 中已包含该模块，语义不一致。

**2. 校验失败行为**

- **决策**：直接 `console.error` + `process.exit(1)`，不生成 registry。
- **理由**：与循环依赖检测一致，build 脚本已采用同样模式；快速失败，避免下游使用无效 registry。

**3. cmdGuide 实现**

- **决策**：从 `ravenDir/<module>/GUIDE.md` 读取，原样输出文件内容；若文件不存在则报错退出。
- **理由**：raven add 已将模块文件拷贝到 raven 目录，GUIDE.md 随模块一并存在；guide 针对已安装模块，不依赖 registry 中是否声明 GUIDE.md。
- **备选**：从源码 modules 目录读取——与 add 后的安装目录不一致，且 init 后可能未 add 任何模块，从 raven 目录读取更符合「已安装模块的指南」语义。

**4. GUIDE.md 是否纳入 registry 的 files**

- **决策**：GUIDE.md 需被 git 追踪（或通过 getGitTrackedFiles 包含），以便 add 时拷贝到用户项目。若当前 EXCLUDED_MODULE_FILES 未排除 GUIDE.md，则默认会被包含在 files 中。不需要在 package.json 的 files 中显式声明。
- **理由**：build 脚本用 `git ls-files` 收集模块文件，GUIDE.md 加入仓库后会自动纳入；add 逻辑拷贝 registry.modules[name].files，因此 GUIDE.md 会随其他文件被拷贝。

## Risks / Trade-offs

- **[Risk] 现有技能依赖 README+源码 输出** → raven-learn、raven-use 等技能需检查是否仍能从纯 GUIDE.md 输出获取所需信息；若 GUIDE.md 需包含 README 摘要或源码引用，由各模块在 GUIDE.md 中自行组织。
- **[Risk] core 等模块 GUIDE.md 当前为空** → 实现本变更前需为 core 等所有 registry 模块补全 GUIDE.md，否则 build 会失败。
- **[Risk] 用户未 run build 而使用旧 registry** → 非本次变更范围；registry 校验仅影响「生成 registry 时」的 build 脚本。

## Migration Plan

1. 为 modules/core 及其他 registry 模块补全 GUIDE.md（可为初版占位内容，后续迭代）
2. 修改 build.ts：在 scanModules 中为每个模块检查 GUIDE.md 存在性，缺则报错
3. 修改 index.ts：cmdGuide 改为读取 GUIDE.md 并输出，删去 README/源码收集逻辑
4. 更新 e2e 测试：期望输出为 GUIDE.md 内容，而非 `<readme>`/`<code>` 标签
5. 检查 packages/ai 下技能文档，确认与新输出格式兼容，必要时更新技能说明

## Open Questions

- 无。GUIDE.md 具体写作规范可后续在 agent-teaching-docs 或模块 README 中补充，不作为本变更的一部分。
