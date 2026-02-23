## Context

当前 CLI 主包是在发布时动态生成的，但是 registry.json 仍然被内联到 raven 二进制文件中。这意味着每次更新 registry 都需要重新编译整个二进制文件，降低了灵活性。

既然主包已经是动态生成的，我们可以将 registry.json 与主包一起发布，通过 wrapper 脚本传递路径给二进制文件。

## Goals / Non-Goals

**Goals:**
- registry.json 与主包一起发布
- wrapper 脚本通过 __dirname 查找同级的 registry.json
- wrapper 脚本找不到 registry.json 时直接报错
- raven cli 从环境变量指定的路径加载 registry
- 移除内联的 registry

**Non-Goals:**
- 修改 registry.json 的内容结构
- 改变 CLI 的功能行为
- 修改平台特定子包

## Decisions

### Decision 1: registry.json 放在主包的根目录

**选择**: registry.json 放在主包的根目录，与 bin/ 目录同级
**替代方案**: 放在 bin/ 目录下

**理由**: 保持文件结构清晰，registry.json 是主包的核心数据文件

### Decision 2: 使用 RAVEN_REGISTRY_PATH 环境变量

**选择**: 环境变量名为 RAVEN_REGISTRY_PATH
**替代方案**: 其他名称

**理由**: 符合项目命名规范，清晰明确

### Decision 3: wrapper 脚本找不到 registry.json 时直接报错

**选择**: 如果找不到 registry.json，wrapper 脚本直接报错退出
**替代方案**: 尝试其他位置或使用内联的 registry

**理由**: 简化逻辑，明确错误，减少歧义

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| wrapper 脚本找不到 registry.json | 使用 __dirname 定位文件，找不到时明确报错 |
| 路径在不同平台上的问题 | 使用 Node.js path 模块处理路径 |

## Migration Plan

1. 修改 create-main-package.ts，在主包中包含 registry.json 文件
2. 修改 wrapper 脚本，通过 __dirname 查找 registry.json 并设置 RAVEN_REGISTRY_PATH 环境变量
3. 修改 wrapper 脚本，找不到 registry.json 时直接报错
4. 修改 index.ts，只从环境变量加载 registry，移除内联的 registry
5. 测试整个流程

## Open Questions

- 没有需要解决的开放问题
