## 1. 去掉预 OCR，准备双通道载荷

- [x] 1.1 扩展/复用 `isVisionCapable(modelId)`；`prepareAttachmentMessage` 不再调用 vision 读图，改为返回 `{ message, imageParts? }`（或等价结构）
- [x] 1.2 会话模型支持 vision：图片进 `imageParts`（path/mime），文本 context 不含读图 notes；不支持：图片进 path 标签/pathAttachments
- [x] 1.3 更新 prepare / build-context / 相关单测；删除或旁路「正在理解图片」阻塞路径

## 2. LLM 多模态贯通

- [x] 2.1 `LLMMessage.content` 支持 `string | ContentPart[]`；`streamChatCompletion` / `invokeChatCompletion` 原样传给 OpenAI SDK
- [x] 2.2 `runAgent` / ipc 将本轮 `imageParts` 传到 turn-runner（或 graph）；组装当轮 user 消息为 text + image_url（读盘 → data URL，含大小/张数上限与降级 notify）
- [x] 2.3 单测：有 imageParts 时发出的 messages 含 `image_url`；无 vision 时不含且有路径文本

## 3. 验证

- [x] 3.1 vitest + tsc
- [ ] 3.2 手动：deepseek 多模态发图应快速出回复；气泡仍为图+原文（需重启 `npm run dev`）
