## Why

当前附件管线在 agent 循环前强制用另一 vision 模型读图，再把纯文本注入会话模型；用户所选模型即使支持多模态也收不到原图。读图阶段慢或挂起时，界面又几乎无状态反馈，表现为「发图无响应」。需要改为：多模态会话模型直接吃图；不能看图时只附路径，不再预 OCR。

## What Changes

**图片进入模型的方式**
- From: 发送前选 vision 模型 OCR → 文本注入；会话模型 MUST NOT 收 `image_url`
- To: 会话模型若判定支持 vision → 当轮 user 消息携带多模态 `image_url`；否则仅路径/元数据进 `<shy-context>`；取消预 OCR
- Reason: 对齐多模态模型能力，消除预读卡顿
- Impact: breaking 相对旧规格「用户模型不收原图」；UI/落库通道不变

**LLM 消息类型**
- `LLMMessage.content` 扩展为可承载 text + image_url parts；turn-runner / graph 组装贯通

## Capabilities

### New Capabilities
- （无）

### Modified Capabilities
- `chat-attachment-pipeline`: 废止预读图与「用户模型不收原图」；改为按会话模型能力透传多模态或降级为路径

## Impact

- 代码：`prepare.ts`、`read-images` 调用路径、`vision-model` 用途、`llm-client`、`turn-runner`、`service`/`ipc` 传附件到 LLM
- 展示/落库：`displayMessage` 不变
- 与进行中的 `shy-context-tags` 并存：文本增强仍用标签；图片优先走多模态 parts
- DB / 依赖：无新依赖
