## Context

RavenJS 当前已有完整的 CLI 工具，包括 `raven install`、`raven add`、`raven update`、`raven self-update` 命令。CLI 使用 `registry.json` 来管理模块，通过 `downloadModule` 函数从 GitHub 下载模块文件。

当前架构：

- `packages/cli/index.ts` - CLI 入口，包含所有命令实现
- `packages/cli/registry.json` - 模块注册表
- `downloadModule()` - 从 GitHub 或本地源下载模块文件

需要在此基础上添加 AI 资源的管理能力。

## Goals / Non-Goals

**Goals:**

- 新增 `raven init` 命令，安装 AI skills 和 commands 到 `.claude/`
- 更新 `raven update` 命令，同时更新框架模块和 AI 资源
- 在 `registry.json` 中添加 AI 资源的定义
- 创建 AI skill 和 command 模板文件

**Non-Goals:**

- 不修改现有 `raven install`、`raven add` 命令的行为
- 不创建新的模块安装机制（复用现有的 `downloadModule`）
- 不实现 AI 资源的版本锁定（与框架使用相同版本）

## Decisions

### 1. AI 资源在 registry.json 中的组织方式

**Decision**: AI 资源作为特殊的 "ai-skills" 模块加入 registry.json

**Rationale**:

- 复用现有的模块下载机制，无需新建代码
- 保持架构一致性
- 便于统一版本管理

**Alternatives Considered**:

- 单独的 AI registry - 会增加复杂度，没有必要
- 硬编码在 CLI 中 - 不够灵活，难以更新

### 2. `raven init` 命令实现

**Decision**: 新增 `cmdInit()` 函数，使用 `downloadModule()` 下载 "ai-skills" 模块到 `.claude/`

**Rationale**:

- 复用现有下载逻辑
- 与 `raven install` 保持一致的用户体验
- 支持 `--source` 和 `--verbose` 选项

**Implementation Details**:

```typescript
async function cmdInit(options: CLIOptions) {
  // 下载 ai-skills 模块到 .claude/
  // 注意：需要修改 downloadModule 支持自定义目标目录
}
```

### 3. `downloadModule` 的扩展

**Decision**: 修改 `downloadModule` 函数，增加可选的目标目录参数

**Rationale**:

- 现有的 `downloadModule` 总是下载到 `raven/<module-name>/`
- AI 资源需要下载到 `.claude/skills/` 和 `.claude/commands/`
- 保持向后兼容

**Signature Change**:

```typescript
async function downloadModule(
  moduleName: string,
  version: string,
  destDir: string,
  options?: CLIOptions,
  targetSubdir?: string, // 新增：目标子目录
): Promise<string[]>;
```

### 4. `raven update` 的更新

**Decision**: 在 `cmdUpdate` 中增加 AI 资源的更新逻辑

**Rationale**:

- 用户期望 `raven update` 更新所有 RavenJS 相关资源
- 保持单一更新入口的简洁性

**Implementation**:

1. 更新框架模块（现有逻辑）
2. 检查 `.claude/` 是否存在
3. 如果存在，更新 AI 资源
4. 合并修改文件列表

### 5. AI 模板文件的存放位置

**Decision**: 在 `packages/cli/templates/` 目录下存放模板

**Structure**:

```
packages/cli/
├── templates/
│   ├── skills/
│   │   ├── raven-install/
│   │   │   └── SKILL.md
│   │   └── raven-add/
│   │       └── SKILL.md
│   └── commands/
│       └── raven/
│           ├── install.md
│           └── add.md
└── registry.json
```

**Rationale**:

- 模板与 CLI 代码在一起，便于维护
- 构建时可以打包进 CLI 二进制
- registry.json 中的路径指向此目录

### 6. AI 资源的文件映射

**Decision**: registry.json 中定义文件到目标位置的映射

**Registry Entry**:

```json
{
  "ai-skills": {
    "files": [
      "skills/raven-install/SKILL.md",
      "skills/raven-add/SKILL.md",
      "commands/raven/install.md",
      "commands/raven/add.md"
    ],
    "fileMapping": {
      "skills/raven-install/SKILL.md": ".claude/skills/raven-install/SKILL.md",
      "skills/raven-add/SKILL.md": ".claude/skills/raven-add/SKILL.md",
      "commands/raven/install.md": ".claude/commands/raven/install.md",
      "commands/raven/add.md": ".claude/commands/raven/add.md"
    }
  }
}
```

**Rationale**:

- 灵活支持不同的目录结构
- AI 资源需要放在 `.claude/` 的特定位置才能被 Claude 识别

## Risks / Trade-offs

### [Risk] AI 资源与框架资源使用相同版本号

- **Mitigation**: 当前设计接受此限制，AI 资源随框架一起发布。未来可考虑独立版本。

### [Risk] `.claude/` 目录可能已被用户用于其他用途

- **Mitigation**: `raven init` 会检查并提示，不会无提示覆盖。

### [Risk] `downloadModule` 的修改可能引入 bug

- **Mitigation**: 保持向后兼容，增加默认参数，现有调用不受影响。

## Migration Plan

1. 创建 `packages/cli/templates/` 目录结构
2. 添加 AI skill 和 command 模板文件
3. 更新 `registry.json` 添加 `ai-skills` 模块
4. 修改 `downloadModule` 支持自定义目标目录
5. 新增 `cmdInit` 函数
6. 更新 `cmdUpdate` 函数
7. 添加 CLI 命令注册

## Open Questions

1. AI 资源是否需要单独的版本管理？当前设计是与框架同版本。
2. 是否需要 `raven ai-update` 单独更新 AI 资源？当前设计是合并在 `raven update` 中。
