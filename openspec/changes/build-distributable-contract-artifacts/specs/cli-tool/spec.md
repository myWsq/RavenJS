## ADDED Requirements

### Requirement: raven build-contract Command

系统 SHALL 提供 `raven build-contract` 命令，用于在独立 contract package 边界内执行 standalone contract artifact build。该命令 SHALL 发现 package-local 配置，定位 backend contract source，并把 contract bundle 与 OpenAPI 产物写入配置的输出目录，而 MUST NOT 直接修改 backend source tree。

#### Scenario: 在独立 contract package 中执行构建

- **WHEN** 开发者在一个配置好的 contract package 目录中执行 `raven build-contract`
- **THEN** CLI SHALL 读取该包的 build-contract 配置
- **AND** CLI SHALL 根据配置定位 backend contract source 与输出目录
- **AND** CLI SHALL 仅向当前 contract package 的输出边界写入构建产物

#### Scenario: build-contract 不回写 backend 源码目录

- **WHEN** CLI 根据配置读取 backend 项目的 `*.contract.ts`
- **THEN** CLI SHALL 将这些文件视为只读输入
- **AND** CLI SHALL NOT 在 backend 项目目录中生成 distributable artifact

### Requirement: raven build-contract Watch Mode

系统 SHALL 为 `raven build-contract` 提供 watch 模式，用于在 contract source 或构建配置变更时重新生成 artifact。

#### Scenario: watch 模式响应 contract 变更

- **WHEN** 开发者执行 `raven build-contract --watch`
- **THEN** CLI SHALL 在初次构建后保持监听
- **AND** 当受监控的 contract source 或 build 配置发生变化时，CLI SHALL 重新生成输出产物
