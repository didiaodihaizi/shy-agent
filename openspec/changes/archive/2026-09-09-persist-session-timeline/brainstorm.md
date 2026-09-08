<!--
Raw capture of superpowers:brainstorming output (对话已收敛后落盘).
-->

# Brainstorm: persist-session-timeline

## 背景

shy 会话正文（user/assistant）已落 SQLite `session_messages`，但工具时间轴、深度思考等过程态只在渲染层内存：

- 切会话会清空；虽已有进程内 `sessionChatCache`，重启后仍丢失
- 用户要求：关软件再开仍能看到完整过程（工具行 + 思考 + 助手定稿）

## 决议链

### Q1：重启后要看到什么粒度？

- 选项：① 完整过程态（工具/思考/定稿，非整段流式逐字）② 连流式草稿也保留 ③ 只要终稿
- **决议：①**

### Q2：存储形态？

- A. 扩展 SQLite `session_messages`（role=tool|reasoning + meta JSON）
- B. `~/.shy/sessions/{id}/timeline.json` 整文件快照
- C. 仅 artifacts 摘要
- **决议：A**

## 设计取舍（摘要）

| 决策 | 选择 | 理由 |
|------|------|------|
| 写入口 | 主进程在 tool_call/result、reasoning 定稿、assistant 定稿时写入 | 单一真相源，与现有 appendMessage 一致 |
| 流式 delta | 不落盘 | 避免膨胀；定稿事件足够重建 UI |
| 进程内缓存 | 保留 | 切会话加速；与 DB 互补 |
| 加载 | `getSessionMessagesPage` 返回扩展消息；渲染层 `toMsg` 还原 tool/reasoning | 复用分页路径 |
| 迁移 | `session_messages` 增加 `meta TEXT`；role 放宽；旧行 meta 空仍可读 | 非破坏 |

## 验收意向

1. 含工具的一轮对话跑完 → 重启 → 同会话可见工具时间轴与正文  
2. 进行中切会话再切回不丢（缓存 + 落盘）  
3. 旧数据无 meta 仍可打开  
