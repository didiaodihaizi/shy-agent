# persist-session-timeline Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development
> to implement this plan task-by-task.

**Goal:** 将工具时间轴与 reasoning/助手定稿写入 SQLite，重启后可回看完整过程态。

**Architecture:** 扩展 `session_messages`（`meta` JSON + role=tool|reasoning）；主进程在定稿事件 upsert/append；分页加载还原 UI。流式 delta 不落盘。进程内 `sessionChatCache` 保留作切会话加速。

**Tech Stack:** Electron main、better-sqlite3、现有 sessions store、React ChatWorkspace / AgentTimeline。

**Change dir:** `openspec/changes/persist-session-timeline/`  
**Worktree:** `.worktrees/persist-session-timeline`（`feat/persist-session-timeline`）

---

## Task 1: Schema 与消息模型

**Files:** `src/main/sessions/store.ts`, `src/shared/ipc.ts`, `src/main/sessions/store.test.ts`

- [ ] **Step 1:** 写失败单测：`upsertSessionToolMessage` insert 后再 update result
- [ ] **Step 2:** `ensureSessionTables` 增加 `meta` 列；扩展 `appendMessage` 可选 meta；实现 tool upsert
- [ ] **Step 3:** 扩展 `ChatMessage` 类型；分页 SELECT 带出 meta 并 JSON.parse
- [ ] **Step 4:** `npx vitest run src/main/sessions/store.test.ts` 通过后提交  
  `feat(sessions): 过程消息 meta 与 tool upsert`

## Task 2: 主进程写入点

**Files:** `src/main/agent/service.ts`, goal-driver 相关 emit 路径, 可选 `src/main/sessions/timeline-persist.ts` helper

- [ ] **Step 1:** 抽出 `persistTimelineEvent(sessionId, event)` helper（tool_call/result/assistant/reasoning）
- [ ] **Step 2:** 挂到 interactive `graphEmit`；补 done 时 running→failed
- [ ] **Step 3:** goal 路径复用同一 helper
- [ ] **Step 4:** 单测 mock store 或集成轻测；提交  
  `feat(agent): 时间轴定稿事件写入 session_messages`

## Task 3: 加载与 UI 还原

**Files:** `src/renderer/src/components/ChatWorkspace.tsx`, 必要时 `AgentTimeline` / `toMsg`

- [ ] **Step 1:** 历史 `toMsg` 映射 tool/reasoning + meta 字段
- [ ] **Step 2:** 确认重启加载路径不依赖仅内存 cache；cache 与 DB 合并策略按 design
- [ ] **Step 3:** 相关单测（纯函数映射优先）；提交  
  `feat(ui): 从持久化历史还原工具时间轴`

## Task 4: 验证

- [ ] **Step 1:** `npm test` 相关套件 + `npm run typecheck`
- [ ] **Step 2:** 手动：工具对话 → 杀进程重启 → 时间轴仍在；打开旧会话无回归
- [ ] **Step 3:** 勾选 `tasks.md` 4.x；准备 `/opsx:verify` / archive

---

## 参考

- Specs: `specs/session-timeline-persistence/`, `specs/agent-timeline-ui/`
- Design: `design.md` D1–D5
