# agent-timeline-ui Specification

## Purpose
Agent 回合时间轴的轻量行展示、思考穿插、完成耗时与搜索结果合并盒。
## Requirements
### Requirement: 时间轴轻量行结构
Agent 回合时间轴 MUST 以轻量行展示工具与过程步骤：含图标、动作标签、次要灰字参数（如搜索 query），并 MUST 支持展开/收起详情。思考类片段 MUST 能穿插在工具行之间展示（例如「深度思考」样式），MUST NOT 要求所有思考只能出现在回合最前或最后。

#### Scenario: 工具行含图标与参数
- **WHEN** 回合中出现一次已识别的工具调用（如 `web_search`）
- **THEN** 时间轴 MUST 显示对应图标与动作标签，并在有参数时以次要样式展示关键参数摘要

#### Scenario: 思考穿插
- **WHEN** 工具调用之间存在 reasoning/思考内容
- **THEN** UI MUST 在时间轴对应位置展示思考片段，MUST NOT 仅把全部思考折叠到回合外独立区域而丢失顺序

---

### Requirement: 回合完成耗时展示
当一轮 Agent 时间轴从进行中转为全部完成（或流式结束且无进行中工具）时，系统 MUST 展示可读的完成态与耗时（例如「已完成 · 1m57s」）。耗时 MUST 基于本轮时间轴可见过程的墙钟时间估算，MUST NOT 要求新增后端字段。

#### Scenario: 完成后显示耗时
- **WHEN** 本轮助手时间轴内工具与流式正文均已结束
- **THEN** UI MUST 显示完成态与耗时文案

---

### Requirement: 网页搜索结果合并盒
对单次 `web_search`（或等价同形结果）工具调用，系统 MUST 将多条搜索结果合并展示在同一浅色圆角容器内（合并盒），盒内每条 MUST 至少包含标题，并 SHOULD 展示来源示意（favicon 或色块兜底）与可识别链接信息。系统 MUST NOT 将同一次调用的每条结果拆成彼此独立的时间轴顶层步骤。

#### Scenario: 多结果进同一合并盒
- **WHEN** 一次 `web_search` 返回不少于两条结构化结果
- **THEN** UI MUST 在该工具行的详情区域内用单个合并盒列出这些结果，MUST NOT 为每条结果各建一条顶层时间轴工具行

---

### Requirement: 从持久化历史还原时间轴
当会话历史中包含已持久化的 tool / reasoning 过程消息时，Agent 时间轴 UI MUST 按消息顺序展示对应轻量行与思考片段，行为 MUST 与实时流式组装时的结构一致（图标、动作标签、可展开详情），MUST NOT 仅把过程信息折叠成不可区分的纯文本块。

#### Scenario: 历史加载含工具行
- **WHEN** 打开会话且历史消息含至少一条 tool 过程消息
- **THEN** 时间轴 MUST 显示对应工具行（含动作标签；有参数摘要时展示次要灰字）

#### Scenario: 历史加载含思考穿插
- **WHEN** 历史中在工具行之间存在 reasoning 过程消息
- **THEN** UI MUST 在对应顺序展示思考片段
