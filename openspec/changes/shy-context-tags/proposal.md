## Why

附件/技能注入目前用中文分段标题（如「图片读图结果」）拼进 agent 上下文，边界靠约定散文，不利于以后统一裁剪、测试与扩展。展示与落库已分离（用户原文 + meta），现在需要把「给模型的注入块」改成带 `shy-` 前缀的标签树，让机器可读边界清晰，同时仍把读图/路径/技能摘要完整告诉大模型。

## What Changes

**Agent 注入格式**
- From: `【挂载技能】` / `【图片读图结果】` / `【附件路径】` / `【用户消息】` 中文分段
- To: 统一根 `<shy-context>`，子标签 `<shy-img>` / `<shy-file>` / `<shy-skill>`；用户原文跟在 context 后、不包标签
- Reason: 结构化边界、易测、可扩展
- Impact: non-breaking（UI/落库通道不变；仅 agent 文本形状变化）

**组装实现**
- `buildAttachmentContext`（及依赖其输出的单测）改为产出标签树；属性转义；无增强时不加空 context

## Capabilities

### New Capabilities
- （无）本期不新增独立 capability；在既有附件管线上改注入格式即可。

### Modified Capabilities
- `chat-attachment-pipeline`: 本轮上下文中技能/读图/非图路径的注入形态改为 `<shy-context>` 标签树；落库与气泡仍为用户原文的要求保持并写清与标签通道的关系。

## Impact

- 代码：`src/main/agent/attachments/build-context.ts`（及相关测试）；`service.test` 等断言中文标题处改为标签断言
- 展示/落库：`encodeUserMessageContent` / `displayMessage` 路径不变；旧 `【】` 展示兜底可保留
- API / DB schema：无变更
- 依赖：无新依赖
