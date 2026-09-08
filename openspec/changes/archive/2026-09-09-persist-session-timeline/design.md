## Context

shy 用 SQLite（`~/.shy/db/shy.sqlite`）存会话与 `session_messages`。当前几乎只写 user/assistant 正文；工具调用与深度思考在渲染层组装成时间轴。进程内已有 `sessionChatCache` 缓解「切会话丢 UI」，但**不跨重启**。

约束：OpenAI-compatible 主循环在主进程；渲染层通过 IPC 收 `tool_call` / `tool_result` / `assistant*` / `reasoning_*`。

## Goals / Non-Goals

**Goals:**
- 工具行、reasoning 定稿、assistant 定稿持久化到同一会话消息表
- 重启后打开会话，时间轴与正文可回看（粒度=过程态，非逐字流）
- 旧消息无 meta 仍可加载
- 保留进程内缓存作切会话加速

**Non-Goals:**
- 不落盘 assistant_delta / reasoning_delta 逐字流
- 不引入独立 timeline.json / 第二数据库
- 不改变 Agent 对 LLM 的 tool 协议
- 不在本 change 做跨设备同步

## Decisions

### D1：存 SQLite `session_messages` 而非 JSON 文件
- **选择**：加 `meta TEXT`（JSON），放宽 role 含 `tool` / `reasoning`
- **理由**：与会话分页、删除级联同源，避免双写
- **已考虑 alternative**：timeline.json 整文件 — 易与正文不一致；否决

### D2：写时机=定稿事件，非流式 delta
- **选择**：`tool_call` 插入/更新 running；`tool_result` 更新 done/failed；`reasoning_done` 或整段 reasoning 写入；`assistant`（非 delta）写入
- **理由**：满足「完整过程态」且控制体积
- **已考虑 alternative**：节流刷 delta — 复杂且收益低；否决

### D3：tool 用稳定 toolId upsert，而非只 append
- **选择**：以 `meta.toolId`（事件 id）唯一定位一行，call 时 insert，result 时 update
- **理由**：UI 已按 toolId 合并；避免重复行
- **已考虑 alternative**：call/result 各 append 一行 — 加载难合并；否决

### D4：加载与渲染
- **选择**：`getSessionMessagesPage` 解析 meta；渲染 `toMsg` 还原 tool/reasoning 字段；有 DB 历史时与内存缓存合并策略保持「缓存优先进行中、DB 为跨重启基线」
- **理由**：少改 UI 结构
- **已考虑 alternative**：专用 IPC `getTimeline` — 多余；否决

### D5：内存缓存去留
- **选择**：保留 `sessionChatCache`，不替代 DB
- **理由**：切会话仍需要即时 UI；DB 是跨重启真相

## Risks / Trade-offs

- [Risk] tool_result 丢失则永远 running → Mitigation: 会话结束/done 时扫 running 标 failed 或保留 running 并由 UI 标明中断
- [Risk] meta JSON 过大（大工具输出）→ Mitigation: 落盘截断/摘要阈值（与现 UI 展示上限对齐），全文仍可在 L2 日志
- [Trade-off] 不存流式半截 → 接受：重启看到定稿过程即可
- [Risk] 主进程多写点遗漏（goal/subagent）→ Mitigation: tasks 覆盖 interactive + goal 主路径；subagent 可跟父会话或 TBD

## Migration Plan

1. `ensureSessionTables`：`ALTER` 增加 `meta`（若不存在）
2. 读写兼容：meta null → 旧行为
3. 新写入带 meta；无需数据回填
4. Rollback：忽略 meta 列即可；新 role 行旧客户端可能当未知 role 跳过（渲染需容忍）

验收：含工具对话 → 重启 → 时间轴可见；旧会话仍可开。

## Open Questions

- subagent 过程是否写入父会话时间轴：本 change **默认不写入**父会话详细 subagent 工具行（保持现状）；若产品需要可另开 change
- reasoning 是否在仅有 delta、从未 `reasoning_done` 时于 `done` 补写：建议 **是**（从缓存/最后流式缓冲落一条）
