# 添加新模块

使用 `raven add` 命令可以向项目中添加新模块。

## 命令格式

```bash
raven add <module-name>
```

## 示例

添加 jtd-validator 模块：

```bash
raven add jtd-validator
```

## 自动依赖处理

`raven add` 会自动处理模块依赖：
- 如果目标模块依赖其他模块，会自动先安装依赖
- 例如：`raven add jtd-validator` 会自动先安装 core（如果还未安装）

## 验证添加结果

添加成功后：
- 返回 JSON 输出，包含 `modifiedFiles` 字段
- 列出了所有新创建/修改的文件
- 可以查看这些文件确认模块已正确添加

## 后续步骤

模块添加后，可以使用 `raven guide <module-name>` 学习该模块的使用方式。
