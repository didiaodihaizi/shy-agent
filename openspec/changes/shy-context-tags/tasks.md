## 1. 标签组装

- [x] 1.1 为属性/正文增加轻量转义辅助（可放在 `attachments/` 旁），并补最小单测
- [x] 1.2 改写 `buildAttachmentContext`：产出 `<shy-context>` + `<shy-img>` / `<shy-file>` / `<shy-skill>`；用户原文跟在后；无增强则原样返回
- [x] 1.3 更新 `build-context` 相关单测（仅图 / 仅文件 / 仅技能 / 混合 / 无增强 / 正文含特殊字符）

## 2. 调用方断言

- [x] 2.1 更新依赖旧 `【图片读图结果】` 等字符串的测试（如 `service.test`）为标签断言
- [x] 2.2 确认落库仍走 `displayMessage`、气泡解码路径无需改动（若有硬编码中文标题的断言一并清理）

## 3. 验证

- [x] 3.1 跑相关 vitest + `tsc`（node/web 按仓库惯例）
- [ ] 3.2 手动：带图发送，气泡无标签；必要时用日志/断点确认 agent 输入含 `<shy-context>`（需重启 `npm run dev` 后由用户点验）
