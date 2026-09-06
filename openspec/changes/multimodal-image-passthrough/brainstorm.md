<!-- Raw capture of brainstorming decision log. -->

# multimodal-image-passthrough — brainstorm capture

## 背景

发送图片后卡住：当前管线会先选 vision 模型预读图再把文字注入会话模型；右上角状态又被隐藏，表现为无响应。用户会话模型（如 deepseek-v4）本身支持多模态，不应再单独 OCR。

## 决议链

### Q1：模型不支持看图时？
- 选项：① 只附路径/元数据照常发 ② 退回预读图 ③ 拦截报错
- **决定：①**

### Q2：实现路径？
- 选项：A 会话模型能看图 → 当轮 image_url，否则仅路径；B 有图一律多模态；C 保留预读后备
- **决定：A**（用户确认「可以」）

## 已批准设计要点

- 气泡/落库不变（原文 + meta）
- 去掉发送前 `readImages` 预 OCR
- 会话模型 vision 启发式为真：当轮 user 多模态 `image_url`（本地 → data URL）
- 否则：`<shy-context>` 仅路径类标签，不预读
- 废止「用户模型不收原图」规格
- 需扩展 `LLMMessage.content` 并贯通 turn-runner

## 验收

- 多模态模型发图：快速进入对话循环，无长时间预读
- 气泡仍为图 + 原文
- 非 vision 模型发图：不预读、带路径、照常开跑
