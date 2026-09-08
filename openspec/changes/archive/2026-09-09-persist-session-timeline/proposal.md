## Why

会话工具时间轴与深度思考目前只存在渲染层内存（及进程内缓存），重启后只剩 SQLite 里的 user/assistant 正文，过程不可回看。用户需要关软件再开仍能看到完整执行过程。现在扩展 `session_messages` 落盘过程态，与现有会话存储同源，避免引入第二套 timeline 文件。

## What Changes

**过程消息落盘**
- From: 仅 user/assistant（及少量 system/result）写入 `session_messages`；tool/reasoning 只在 UI
- To: tool 行、reasoning 定稿、assistant 定稿写入 DB；流式 delta 不落盘
- Reason: 重启可重建时间轴
- Impact: non-breaking；旧行无 meta 仍可读

**消息模型扩展**
- From: `ChatMessage.role` 无稳定的 tool/reasoning 元数据
- To: role 含 `tool` / `reasoning`；`meta` JSON 存 toolId、input、result、status、durationMs 等
- Reason: 分页加载即可还原 AgentTimeline
- Impact: non-breaking schema 迁移（加列）

**写入点**
- From: 主进程主要在完整 assistant 时 `appendMessage`
- To: `tool_call` / `tool_result`（upsert）、reasoning 定稿、assistant 定稿时持久化
- Reason: 单一真相源在主进程
- Impact: non-breaking；IPC 事件协议可不变

## Capabilities

### New Capabilities
- `session-timeline-persistence`: 会话过程态（tool/reasoning/assistant 定稿）持久化与重启加载

### Modified Capabilities
- `agent-timeline-ui`: 加载路径须能从持久化消息还原轻量时间轴行（不仅内存流）

## Impact

- `src/main/sessions/store.ts`：schema（`meta`）、append/upsert、分页读出
- `src/shared/ipc.ts`：`ChatMessage` 类型
- `src/main/agent/service.ts`（及 goal 路径）：过程事件写库
- `src/renderer/.../ChatWorkspace.tsx`：`toMsg` / 历史加载还原 tool/reasoning；内存缓存仍作切会话加速
- 现有 `openspec/specs/agent-timeline-ui`
