# composer-plus-attachments Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or openspec-apply-change to implement this plan task-by-task.

**Goal:** Composer `+` 可挂多技能/多文件（chip + 图片 hover 预览）；发送前用当前 provider 的 vision 模型读图，再把文本结果交给用户所选模型。

**Architecture:** Renderer 维护本轮 `skills`/`attachments` chip 状态，经扩展后的 `ChatRequest` 交给 main；`agentChat` 在 `runAgent` 前做 vision 选型与读图，组装纯文本增强上下文。用户模型请求不携带原图。

**Tech Stack:** Electron dialog、React composer、shared IPC 类型、OpenAI-compatible chat completions（含 image_url 仅用于读图步骤）。

**工作目录：** 主仓库或独立 worktree 均可；实现前建议 `feat/composer-plus-attachments` 分支。

---

## Task 1: ChatRequest + pickFiles IPC

**Files:**
- Modify: `src/shared/ipc.ts`
- Modify: `src/preload/index.ts`, `src/preload/index.d.ts`
- Modify: `src/main/ipc.ts`
- Test: `src/preload/index.test.ts` 或新建契约测试

- [ ] **Step 1:** 在 `ChatRequest` 增加：
  ```ts
  skills?: { id: string; name: string }[]
  attachments?: { path: string; name: string; mime: string; kind: 'image' | 'file' }[]
  ```
- [ ] **Step 2:** 新增 `IPC.projectPickFiles` + `pickFiles()`：`showOpenDialog({ properties: ['openFile','multiSelections'] })`，返回 `{ ok, paths }` 或与现有 pick 错误形态一致。
- [ ] **Step 3:** 更新 preload 暴露与类型；跑相关 preload 测试。
- [ ] **Step 4:** Commit：`feat(ipc): ChatRequest 附件字段与多选文件`

---

## Task 2: Vision 选型 + 读图 + 上下文组装

**Files:**
- Create: `src/main/agent/attachments/vision-model.ts`
- Create: `src/main/agent/attachments/read-images.ts`
- Create: `src/main/agent/attachments/build-context.ts`
- Create: 对应 `*.test.ts`
- Modify: `src/main/ipc.ts`（`agentChat`）或 `src/main/agent/service.ts` 入口

- [ ] **Step 1:** 写失败测试：`pickVisionModel(ids)` — 优先含 `vision` 的 id；否则返回 null。
- [ ] **Step 2:** 实现选型并通过测试。
- [ ] **Step 3:** 写测试：无 vision → 图片列入 `pathAttachments`，`imageNotes` 为空。
- [ ] **Step 4:** 实现 `readImages`（mock fetch）：成功得到 notes；失败降级。
- [ ] **Step 5:** 实现 `buildAttachmentContext({ skills, attachments, imageNotes, userText, skillSummaries })` 纯函数拼装。
- [ ] **Step 6:** 在 `agentChat` 中：校验 → 读图 → 用增强 message（或并行 system 块）调用现有 `runAgent`；状态可经既有 event 通道提示「正在理解图片…」。
- [ ] **Step 7:** Commit：`feat(agent): 发送前读图并组装附件上下文`

---

## Task 3: Composer `+` / chip / hover / slash

**Files:**
- Create: `src/renderer/src/components/ComposerPlusMenu.tsx`（或同目录拆分）
- Create: `src/renderer/src/components/ComposerAttachmentChips.tsx`
- Modify: `src/renderer/src/components/ChatWorkspace.tsx`
- Modify: `src/renderer/src/styles/app.css`
- 可选测试：chip 状态纯函数

- [ ] **Step 1:** 去掉 `composer-plus` 的 `disabled`；挂自绘菜单两项。
- [ ] **Step 2:** 「添加技能」→ 已启用技能列表（可过滤）；选中追加 skill chip（去重）。
- [ ] **Step 3:** 「添加文件」→ `pickFiles`；按扩展名/mime 标 `image|file`；追加 file chip。
- [ ] **Step 4:** 输入区顶部渲染 chip 行（技能图标+名；文件图标+名；× 移除）；样式贴近参考图。
- [ ] **Step 5:** 图片 chip：`onMouseEnter` 显示 popover（`file://` 或读 data URL）；离开关闭。
- [ ] **Step 6:** `selectSlash` 技能分支改为加 chip，不再 `setContent('使用技能…')` 作为唯一手段。
- [ ] **Step 7:** `onSend`：带上 skills/attachments；成功后清空 chip；busy 时可显示读图提示（若 main 发 status）。
- [ ] **Step 8:** Commit：`feat(ui): Composer 加号附件 chip 与图片预览`

---

## Task 4: 验收

- [ ] **Step 1:** `npx vitest run` 覆盖 attachments / vision 相关测试。
- [ ] **Step 2:** 手动：`npm run dev` — 多技能多文件、hover 预览、发送后清空、无 vision 降级提示。
- [ ] **Step 3:** 勾选 `tasks.md` 全部项；准备 `/opsx:verify`。
