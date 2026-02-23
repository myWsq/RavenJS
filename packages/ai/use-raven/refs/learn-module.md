# 学习模块知识

使用 `raven guide` 命令可以学习某个模块的设计和代码。

## 命令格式

```bash
raven guide <module-name>
```

## 输出格式

`guide` 命令输出 Markdown 格式的内容，包含两个部分：

```
<reedme>
README.md 内容 - 包含模块的设计意图、架构说明
</readme>

<code>
文件: path/to/file.ts
```typescript
代码内容 - 关键源码
```
</code>
```

## 如何阅读 README

README 通常包含：
- **OVERVIEW** - 模块概述
- **HOW TO READ THIS CODE** - 代码阅读指南
- **CORE CONCEPTS** - 核心概念
- **ARCHITECTURE** - 架构设计
- **DESIGN DECISIONS** - 设计决策

## 如何阅读代码

代码部分会标记关键的代码位置：
- 重要的类型定义
- 核心函数
- 导出接口

## 学习建议

1. 先读 README 理解设计意图
2. 再读代码理解实现细节
3. 重点关注标记为"KEY CODE LOCATIONS"的部分
