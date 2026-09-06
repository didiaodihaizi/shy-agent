## Context

`composer-plus-attachments` 落地了「vision 预读 → 纯文本注入」。用户反馈多模态会话模型发图卡住。`shy-context-tags` 把注入格式改成标签树，但不改变「预读再注入」策略。本 change 改策略：取消预 OCR，按会话模型能力透传图片。

## Goals / Non-Goals

**Goals:**
- 会话模型支持 vision 时，当轮 LLM 请求携带本地图片的 `image_url`（data URL）
- 不支持时仅路径元数据，不预读、不拦截
- 气泡仍展示用户原文 + 图片；落库不含二进制
- 删除发送路径上的预 OCR 等待

**Non-Goals:**
- 不做完整模型能力目录/远程探测
- 不把历史轮次图片重新灌进后续请求（仅当轮透传；历史仍以落库文本/meta 为准）
- 不改非图文件整文件灌入策略

## Decisions

### D1：能力判定对象 = 会话所选模型
- **选择**：对 `resolveLlmConfig` 得到的当前 `model` 做 vision 启发式（复用/扩展 `vision-model` 逻辑）
- **理由**：用户选谁就用谁吃图
- **已考虑 alternative**：另选专用 vision 模型预读（现状，已否决）

### D2：非 vision → 仅路径
- **选择**：图片进入 path 类标签/元数据，继续发送
- **理由**：用户明确选 1；不偷偷换模型、不拦截

### D3：多模态只挂在当轮 user 消息
- **选择**：`runAgent` 携带本轮 image 附件列表；组装 LLM messages 时把**本轮**对应用户文本改为 `content: parts[]`（text + image_url）
- **理由**：落库仍纯文本+meta；避免历史膨胀与重读磁盘成本失控
- **已考虑 alternative**：把 parts 序列化进 DB → 展示与体积问题大

### D4：扩展 LLMMessage.content
- **选择**：`string | Array<TextPart | ImageUrlPart>`，OpenAI-compatible
- **理由**：SDK 已支持；改动集中在 llm-client + turn-runner 映射

### D5：预 OCR 代码
- **选择**：`prepareAttachmentMessage` 不再调用 vision 读图；`readImages` 可保留作工具/测试或逐步删调用点
- **理由**：主路径零等待

## Risks / Trade-offs

- [Risk] 启发式误判「能看图」→ API 报错 → Mitigation: 错误透出给用户；后续可扩白名单
- [Risk] 大图 data URL 撑爆上下文 → Mitigation: 本期可限制张数/单张大小（实现时设合理上限，超限降级为路径并 notify）
- [Trade-off] 后续轮次模型看不到上轮原图 → 接受（与「落库不存二进制」一致）

## Migration Plan

- N/A 部署；发版后新发送即走新路径
- Rollback：恢复 prepare 预读调用
- 验收：多模态发图秒进循环；气泡有图无卡死感

## Open Questions

- 无阻塞。deepseek 等具体 id 可在实现时扩 `KNOWN_VISION_MODEL_IDS` / 名称启发。
