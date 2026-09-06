## Context

shy 已有 `AgentTimeline` + tool renderers + `ReActContent`（流式纯文本）。WorkBuddy（`../workbuddy`）用 `MarkdownRenderer(complete)` 边流边渲染，时间轴与 `web_search` 合并盒观感更清晰。本 change 在 renderer 对齐，不改工具协议。

## Goals / Non-Goals

**Goals:**
- 流式 Markdown 可读、少花屏；`complete` 控制重型块
- 时间轴视觉接近 WorkBuddy：图标行、思考穿插、完成耗时
- `web_search` 单次调用结果合并进浅灰盒

**Non-Goals:**
- 移植反馈栏/checkpoint/Yuanbao
- 跨多次 search tool_call 硬合并成一组
- 重做全部工具内部视觉

## Decisions

### D1：流式也渲染 Markdown
- **选择**：`complete={!streaming}` 传入 Markdown；预处理补未闭合 \`\`\`
- **理由**：对齐 WorkBuddy；避免纯文本→MD 硬切
- **已考虑**：流式纯文本（现状）

### D2：时间轴保留 TurnSegment 模型
- **选择**：事件模型不变；改壳层样式与 Search renderer
- **理由**：成本低、风险小

### D3：搜索合并粒度 = 单次 tool_call
- **选择**：一次 `web_search` 一盒多结果；不跨 call 合并
- **理由**：对齐图一常见形态；逻辑简单

### D4：耗时来源
- **选择**：本轮 timeline 首段出现至全部 done/流式结束的墙钟时间；展示「已完成 · XmYs」（流式中可显示「进行中」或不显示完成条）
- **理由**：无需后端新字段

## Risks / Trade-offs

- [Risk] 流式每 token 全量 markdown 重解析卡顿 → Mitigation: memo + 必要时节流（实现时按需）
- [Risk] 视觉与 WorkBuddy 像素级不一致 → Mitigation: 对齐结构与关键样式，不保证像素克隆
- [Trade-off] 非搜索工具仅统一外壳 → 接受

## Migration Plan

- N/A DB；worktree 开发 → 合入 `dev` 后删主仓残留 change 目录（若有）

## Open Questions

- 无阻塞。favicon：有 URL 时用默认 favicon 服务或首字母色块兜底。
