## Context

当前 CLI (packages/cli/index.ts) 依赖本地源码目录 RAVEN_SOURCE_DIR 复制代码，不支持用户独立安装。用户需要克隆整个仓库或设置环境变量才能使用，缺乏 registry 机制。

**当前状态**:
- CLI 从 `RAVEN_SOURCE_DIR/packages/*` 复制代码到 `src/raven/`
- 无 registry 描述模块文件
- 版本信息分散在各个 package.json
- 无 CLI 自我更新机制
- 所有包都在 packages/ 目录下，未区分 CLI 工具和分发模块

**约束**:
- 使用 Bun 作为运行时
- 模块为目录形式（core/, jtd-validator/）
- 只支持外部依赖，无模块间依赖

## Goals / Non-Goals

**Goals:**
- 实现 registry.json 机制，描述各模块的文件路径和外部依赖
- 编译时自动扫描 modules/ 目录生成 registry.json
- 将需要分发的模块移到 modules/ 目录，与 packages/（CLI工具）分离
- 用户目录改为可配置的 `<root>/raven/`，默认 `raven/`
- raven.yaml 存储版本信息
- 添加 `raven self-update` 命令
- 支持从 GitHub 并行下载单文件

**Non-Goals:**
- 不支持单独更新某个模块
- 不支持指定版本安装
- 不支持模块间依赖解析
- 不支持私有 registry

## Decisions

### 1. Registry 文件声明

每个模块在 package.json 中使用 `dist` 字段声明分发的文件：

```json
{
  "name": "@ravenjs/jtd-validator",
  "dist": ["index.ts", "main.ts", "README.md"]
}
```

编译时扫描 modules/*/package.json，读取 `dist` 字段生成 registry。

** alternatives considered **:
- 约定规则自动扫描: 不够精确，可能包含不需要的文件
- glob patterns: 增加复杂度

### 2. Modules 目录结构

新建 `modules/` 目录，与 `packages/`（CLI工具）并列：

```
ravenjs/
├── packages/       # CLI 和工具
│   └── cli/
└── modules/       # 分发给用户的模块
    ├── core/
    └── jtd-validator/
```

编译时扫描 `modules/*/package.json` 生成 registry。

** alternatives considered **:
- 使用 packages/ 的标记字段: 增加配置复杂度
- 在 packages/ 内新建子目录: 嵌套太深

### 2. 下载方式

使用 GitHub Raw API 并行下载：
```
https://raw.githubusercontent.com/ravenjs/ravenjs/v{version}/{filePath}
```

** alternatives considered **:
- Download release tarball: 需要处理 tarball 解压和清理
- Git clone: 体积太大，不适合

### 3. Registry 生成时机

在 `bun run build` 时调用 `scripts/generate-registry.ts`，生成后内嵌到 CLI 二进制中。

** alternatives considered **:
- 运行时从远程获取: 增加网络依赖
- 手动维护: 容易出错

### 4. CLI 自我更新

使用 npm/bun 的全局安装机制：
- `bunx @ravenjs/cli@latest` 方式运行
- 或 `npm install -g @ravenjs/cli`

**决定**: CLI 本身不实现自我更新，而是文档说明通过包管理器更新。

### 5. 用户目录配置

```typescript
interface CLIOptions {
  ravenRoot?: string;  // 默认 "raven"
  verbose?: boolean;
}
```

**决定**: 使用 `--raven-root` 或环境变量 `RAVEN_ROOT` 指定。

## Risks / Trade-offs

1. **GitHub API 限流** → Mitigation: 使用 raw.githubusercontent.com（不受 rate limit 影响）
2. **版本不同步** → Mitigation: 统一版本号，CLI/RavenJS 同版本
3. **网络下载失败** → Mitigation: 添加重试机制和友好的错误信息
4. ** Breaking Change 迁移** → Mitigation: 提供迁移脚本或文档

## Migration Plan

1. 旧用户从 `src/raven/` 迁移到 `raven/`
2. 运行 `raven update` 重建目录结构
3. 更新 SKILL.md 路径引用
