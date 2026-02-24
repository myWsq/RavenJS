# Validator Specification

> **Migration Note**: This spec consolidates following original spec:
> - `handler-schema-validation`

## Purpose

Deprecated. JTD Validator module has been removed.

## Requirements

### Requirement: Core 只做 State 赋值 (Core State Assignment Only)

`@ravenjs/core` 的 `processStates()` SHALL 只负责解析请求数据并赋值到对应 State，不执行任何 Schema 验证。

#### Scenario: Body 数据赋值

- **WHEN** 收到带有 JSON Body 的 POST 请求
- **THEN** Core SHALL 使用 `request.json()` 解析请求体
- **AND** 将解析后的数据通过 `BodyState.set(data)` 赋值
- **AND** 不执行任何 Schema 验证

#### Scenario: Query 参数赋值

- **WHEN** 收到带有查询参数的请求
- **THEN** Core SHALL 将 `url.searchParams` 转换为对象并通过 `QueryState.set(query)` 赋值

### Requirement: Schema 库无关性 (Schema Library Agnostic)

Core 层 SHALL 完全不依赖任何 Schema 验证库。

#### Scenario: Core 无 Ajv 依赖

- **WHEN** 检查 `@ravenjs/core` 的 package.json
- **THEN** SHALL 不包含 `ajv` 依赖

#### Scenario: 使用原始 State 访问

- **WHEN** 用户不安装任何验证包，直接使用 `BodyState.get()`
- **THEN** SHALL 返回 `unknown` 类型的原始数据，无验证
