## Why

助手回复以 Markdown 流式输出时，半截语法会导致排版花屏；时间轴与搜索结果展示也弱于 WorkBuddy（图一：搜索结果收进浅灰合并盒、图标行、思考穿插、完成耗时）。需要在一期对齐 WorkBuddy 的流式渲染与时间轴交互观感，提升可读性与过程透明度。

## What Changes

**流式 Markdown**
- From: 流式用纯文本，结束再切 Markdown（或半截 MD 花屏）
- To: 流式也渲染 Markdown，带 `complete`；未闭合 fence 容错；Mermaid 等完成后再画
- Impact: non-breaking UI

**时间轴**
- From: 现有 `AgentTimeline` 功能可用但视觉/结构偏简单
- To: 对齐 WorkBuddy 轻量行（图标+标签+灰字参数+可展开）、思考穿插、一轮「已完成 · 耗时」
- Impact: non-breaking UI

**搜索结果合并**
- From: `web_search` 结果散列表
- To: 单次 tool_call 一行摘要 + 展开区内浅灰圆角结果盒（title/favicon/链接）
- Impact: non-breaking UI

## Capabilities

### New Capabilities
- `streaming-markdown`: 流式 Markdown 渲染与 complete/容错约定
- `agent-timeline-ui`: 时间轴视觉结构、思考穿插、完成耗时、搜索结果合并展示

### Modified Capabilities
- （无既有 capability 契约必须改；实现落在 renderer chat 组件）

## Impact

- 代码：`MarkdownBody`、`ReActContent`、`AgentTimeline`、`ToolRowShell`、`SearchFetch`、相关 CSS；可选 `turnSegments` 仅 UI 聚合
- 后端/IPC/工具 schema：无变更
- Worktree：`.worktrees/workbuddy-timeline-parity`（`feat/workbuddy-timeline-parity`）
