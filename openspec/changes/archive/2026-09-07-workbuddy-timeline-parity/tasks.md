## 1. 流式 Markdown

- [x] 1.1 `MarkdownBody` 支持 `complete`；未完成时对未闭合 \`\`\` 做展示用容错
- [x] 1.2 `ReActContent` 流式也走 Markdown（去掉纯文本分支），传入 `complete={!streaming}`
- [x] 1.3 单测：未闭合 fence 容错；流式/完成切换

## 2. 时间轴壳层

- [x] 2.1 统一 `ToolRowShell` / timeline CSS：图标行、灰字参数、展开态（对齐 WorkBuddy 轻量行）
- [x] 2.2 Reasoning 穿插展示为「深度思考」风格行
- [x] 2.3 回合完成耗时条（墙钟估算）

## 3. 搜索合并盒

- [x] 3.1 改写 `SearchToolRenderer`：摘要行 + 浅灰合并盒列表（title/favicon 或色块/链接）
- [x] 3.2 样式与截图结构对齐；非搜索工具不破坏

## 4. 验证

- [x] 4.1 vitest + 相关组件单测；`tsc`（web）
- [x] 4.2 手动：流式 MD、搜索合并盒、完成耗时（worktree 内 `npm run dev`）
