<!-- Raw capture of brainstorming decision log. -->

# workbuddy-timeline-parity — brainstorm capture

## 背景

流式 Markdown 未闭合时花屏；用户希望对齐 WorkBuddy：边流边 Markdown + 时间轴样式/逻辑 + 搜索结果合并盒（图一）。对照 WorkBuddy 打包代码（`MarkdownRenderer` 的 `complete`、`MessageTimeline`、`WebSearchRenderer`）与 shy 现有 `AgentTimeline` / `ReActContent`。

## 决议链

### Q1：处理策略？
- 曾列 A 容错 MD / B 纯文本流式 / C 延迟渲染
- 用户要求按 WorkBuddy → **边流边 MD + complete**

### Q2：一期范围？
- A 全做 / B 先时间轴 / C 先流式 MD
- **决定：A 一期全做**（流式 MD + 时间轴改版 + 搜索合并）

## 已批准设计要点

**In：** 流式 Markdown（complete、fence 容错、Mermaid 完成再画）；时间轴视觉与结构；web_search 结果浅灰合并盒  
**Out：** 不移植赞踩/checkpoint/Yuanbao；不改工具协议；非搜索工具只统一外壳，不逐个重做视觉

验收：流式可读不花屏；搜索呈图一类合并盒；时间轴有图标行+思考穿插+完成耗时；非搜索工具仍可用。
