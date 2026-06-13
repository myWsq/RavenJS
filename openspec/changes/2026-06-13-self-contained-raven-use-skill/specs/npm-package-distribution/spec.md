## MODIFIED Requirements

### Requirement: 构建产物与导出约定

`@raven.js/core` SHALL 提供构建步骤，产出可发布的 JS 与 `.d.ts`。`exports` SHALL 覆盖公共入口——至少包含包根 `.`（与 `index.ts` 的导出面保持一致），以及前端安全的 contract 子入口 `./contract`。源码内部的相对 import SHALL 在构建中被正确解析（不依赖运行时 `.ts` 扩展名解析）。`files` 白名单 SHALL 仅包含构建产物目录（`dist`）、精简 `README.md` 与 `LICENSE`。

#### Scenario: 构建生成产物

- **WHEN** 运行包的 build 脚本
- **THEN** SHALL 生成 JS 产物与对应类型声明，包含包根入口（`dist/index.{mjs,d.mts}`）与 contract 子入口（`dist/contract/index.{mjs,d.mts}`）
- **AND** `files` 白名单 SHALL 仅包含 `dist`、`README.md` 与 `LICENSE`

#### Scenario: 导出面一致

- **WHEN** 消费方从包入口导入公共 API
- **THEN** 从 `.` 可导入的符号 SHALL 与 `index.ts` 声明的导出一致
- **AND** 从 `./contract` 可导入 `defineContract` 与 `InferContract*` 等 contract 公共 API

## ADDED Requirements

### Requirement: npm 包不分发教学文档

`@raven.js/core` npm 包的发布物 SHALL NOT 包含任何教学/skill 文档。早期版本随包发布的 `GUIDE.md` 与 `PLUGIN.md` SHALL 被移除，且 SHALL NOT 通过 `files` 重新纳入；包内 `README.md` SHALL 为精简门面。框架教学统一由 `raven-use` skill 承载。

#### Scenario: 发布物清单可验证

- **WHEN** 对 `@raven.js/core` 运行 `npm pack --dry-run`
- **THEN** 文件清单 SHALL 仅包含 `dist/*`、`README.md`、`LICENSE` 与 `package.json`
- **AND** SHALL NOT 包含 `GUIDE.md`、`PLUGIN.md` 或任何分层 pattern / skill 文档

### Requirement: 前端安全的 contract 子入口

`@raven.js/core` SHALL 提供 `./contract` 子入口，导出 `defineContract`、`InferContract*` 等 contract 相关公共 API。该子入口的模块依赖图 SHALL NOT 触达任何运行时实现（不引入 Hono、`AsyncLocalStorage` 或 `Raven` 类），以保证从该子入口导入的 `contract.ts` 可被前端代码安全引用。运行时 API（如 `withSchema`、`registerContractRoute`、`Raven`）SHALL 仍从包根 `@raven.js/core` 导出。

#### Scenario: contract 子入口可解析且前端安全

- **WHEN** 前端或同项目代码执行 `import { defineContract } from "@raven.js/core/contract"`
- **THEN** 该导入 SHALL 正确解析到 `dist/contract/index.mjs`（不产生 `ERR_PACKAGE_PATH_NOT_EXPORTED`）
- **AND** 其加载的模块图 SHALL NOT 包含 Hono / `AsyncLocalStorage` / `Raven` 运行时
