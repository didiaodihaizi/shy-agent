## 1. Schema 与消息模型

- [x] 1.1 `session_messages` 增加 `meta TEXT`（迁移兼容）；读写 API 支持 meta
- [x] 1.2 扩展 `ChatMessage`：`role` 含 `tool` | `reasoning`；可选 `meta` 结构（toolId/name/status/input/result/error/durationMs 等）
- [x] 1.3 实现 `upsertSessionToolMessage` / `appendProcessMessage`（reasoning、assistant 定稿）；单测覆盖 insert→update、旧行无 meta

## 2. 主进程写入点

- [x] 2.1 interactive：`service` graphEmit 路径在 `tool_call` / `tool_result` / `assistant` / reasoning 定稿时写库
- [x] 2.2 goal 主路径同等写入（与 interactive 共用 helper）
- [x] 2.3 回合 `done` 时将仍为 running 的 tool 标为中断/failed（或等价终态）；单测或轻量集成断言

## 3. 加载与 UI 还原

- [x] 3.1 `getSessionMessagesPage` / `getSession` 返回 meta 与新 role
- [x] 3.2 `ChatWorkspace.toMsg`（或等价）从历史还原 tool/reasoning 行，时间轴可展示
- [x] 3.3 与现有内存 `sessionChatCache` 共存：重启以 DB 为准；进程内切会话仍可用缓存

## 4. 验证

- [x] 4.1 vitest：store upsert + 分页含 tool；相关渲染映射单测
- [ ] 4.2 手动：含工具对话 → 重启 → 打开同会话见时间轴；旧会话无 meta 仍可开
