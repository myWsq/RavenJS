## 1. Generate Registry: dependsOn

- [x] 1.1 在 generate-registry 中解析各模块 package.json 的 dependencies 和 devDependencies，提取 @ravenjs/* 引用并转换为模块名（如 @ravenjs/core → core）
- [x] 1.2 为每个模块输出 dependsOn 数组到 registry；若无工作区依赖则输出空数组
- [x] 1.3 添加循环依赖检测，若存在则报错退出
- [x] 1.4 运行脚本重新生成 registry.json 并验证输出

## 2. CLI: Remove install and refactor init

- [x] 2.1 移除 install 命令注册及 cmdInstall 相关代码
- [x] 2.2 重构 cmdInit：增加 raven 根目录和 raven.yaml 初始化逻辑
- [x] 2.3 实现 init 幂等：若 raven 根目录已存在且 raven.yaml 存在，则跳过根目录更新，仅更新 AI Resource
- [x] 2.4 确保 init 不再下载或安装 core 模块

## 3. CLI: Status 输出结构调整

- [x] 3.1 修改 getStatus 和 StatusResult：移除 core 顶层字段，改为 modules 数组包含所有 registry 模块
- [x] 3.2 每个模块项包含 name 和 installed；按 name 排序
- [x] 3.3 更新 cmdStatus 输出格式

## 4. CLI: Add 依赖解析与安装

- [x] 4.1 实现 getInstallOrder(moduleName, registry)：根据 dependsOn 拓扑排序，返回待安装模块列表（含依赖）
- [x] 4.2 添加循环依赖检测，若存在则 error 退出
- [x] 4.3 修改 cmdAdd：在安装目标模块前，按拓扑顺序安装未安装的依赖
- [x] 4.4 修改 ensureRavenInstalled：add 时若根目录不存在则提示先运行 raven init

## 4a. CLI: Import 路径替换

- [x] 4a.1 实现 replaceRavenImports(content, fromDir, registry)：将内容中的 `@ravenjs/<module>` 替换为从 fromDir 到 `<module>` 目录的相对路径
- [x] 4a.2 在 downloadModule 写入文件前，对 .ts/.js 等源码文件调用 replaceRavenImports 并写入替换后的内容

## 5. Registry Interface 与类型

- [x] 5.1 更新 RegistryModule 接口，增加 dependsOn?: string[]
- [x] 5.2 确保 loadRegistry 及所有使用处兼容新结构

## 6. AI Skills 更新

- [x] 6.1 更新 raven-install skill：改为指导执行 raven init 后 raven add core
- [x] 6.2 更新 raven-add skill（如需要）：说明 add 会自动安装依赖

## 7. 测试与文档

- [x] 7.1 更新或添加 init 相关测试（幂等、根目录创建）
- [x] 7.2 更新或添加 status 相关测试（全量模块、installed 字段）
- [x] 7.3 更新或添加 add 相关测试（依赖自动安装、循环检测、import 路径替换）
- [x] 7.4 移除或更新原 install 相关测试
- [x] 7.5 更新 CI 或文档中所有 `raven install` 为 `raven init` + `raven add core`
