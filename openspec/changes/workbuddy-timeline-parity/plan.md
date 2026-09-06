# workbuddy-timeline-parity Implementation Plan

> **For agentic workers:** `/opsx:apply`；工作目录 `.worktrees/workbuddy-timeline-parity`。

**Goal:** 对齐 WorkBuddy：流式 Markdown + 时间轴轻量行 + 搜索结果合并盒。

**Architecture:** 保留 `TurnSegment`；改 `MarkdownBody`/`ReActContent` 的 complete 与容错；改 `ToolRowShell`/`SearchToolRenderer` 与 CSS。

**Tech Stack:** React、react-markdown、remark-gfm、vitest。

---

## Task 1: Streaming Markdown

**Files:** `MarkdownBody.tsx`, `ReActContent.tsx`, `lib/streamingMarkdown.ts`（新建容错）, tests

- [ ] **Step 1:** 写容错与 complete 相关失败测试
- [ ] **Step 2:** 实现容错 + MarkdownBody complete；ReActContent 流式用 Markdown
- [ ] **Step 3:** 测试通过并 commit

## Task 2: Timeline shell + search box

**Files:** `ToolRowShell`, `SearchFetch.tsx`, `ReasoningBlock`/`AgentTimeline`, `app.css`

- [ ] **Step 1:** 壳层样式与深度思考行
- [ ] **Step 2:** 搜索合并盒 + 完成耗时
- [ ] **Step 3:** 测试/类型检查 + commit

## Task 3: Manual verify

- [ ] `npm run dev`（本 worktree）走查流式与搜索
