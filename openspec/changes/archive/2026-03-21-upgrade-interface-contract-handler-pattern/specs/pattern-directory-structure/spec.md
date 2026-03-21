# pattern-directory-structure Specification

## ADDED Requirements

### Requirement: Interface 目录必须按 Entrypoint 子目录拆分

RavenJS 的 pattern 文档在描述 `interface/` 目录时 SHALL 使用“每个 entrypoint 一个子目录”的结构，并 MUST 将每个子目录固定描述为 `<entry>.contract.ts` 与 `<entry>.handler.ts` 两个文件。文档 MUST NOT 推荐在该子目录内使用 `index.ts` 聚合，也 MUST NOT 继续把单文件 `*.interface.ts` 作为默认目录约定。

#### Scenario: 目录树示例展示 entrypoint 子目录

- **WHEN** 文档展示 `<app_root>/interface/` 的推荐目录树
- **THEN** 示例 SHALL 显示 `interface/create-order/create-order.contract.ts` 与 `interface/create-order/create-order.handler.ts`
- **AND** SHALL 不再把多个 `*.interface.ts` 文件直接平铺为默认示例

#### Scenario: Interface 子目录中不使用 index.ts

- **WHEN** 文档解释 `interface/create-order/` 目录内部的组织方式
- **THEN** 文档 SHALL 仅推荐 `create-order.contract.ts` 与 `create-order.handler.ts`
- **AND** SHALL 明确 `index.ts` 不是该模式下的推荐聚合入口
