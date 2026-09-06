## ADDED Requirements

### Requirement: 流式阶段渲染 Markdown
系统 MUST 在助手正文流式输出期间使用 Markdown 渲染器展示已累积文本，MUST NOT 仅因流式未结束而强制降级为纯文本。渲染器 MUST 接收表示「本段是否已完成」的信号（如 `complete`），以便推迟仅适合完成态的重型渲染。

#### Scenario: 流式中可见排版
- **WHEN** 助手正文正在流式追加且内容含 Markdown 标题或列表语法的已完整行
- **THEN** UI MUST 以 Markdown 形式展示这些部分，MUST NOT 整段退回纯文本模式

#### Scenario: complete 信号区分完成态
- **WHEN** 流式仍在进行
- **THEN** 传入 Markdown 渲染路径的完成态信号 MUST 为未完成；流式结束后 MUST 为已完成

---

### Requirement: 未闭合围栏容错
在流式未完成时，若累积文本中代码围栏（\`\`\`）处于未闭合状态，系统 MUST 在渲染前对用于展示的文本做容错处理（例如临时补闭合围栏），使页面 MUST NOT 因半截围栏而出现大范围排版崩溃。完成后 MUST 以真实原文为准渲染。

#### Scenario: 未闭合代码块不花屏
- **WHEN** 流式文本出现了开始的 \`\`\` 但尚未出现配对结束围栏
- **THEN** 渲染结果 MUST 仍以代码块形式呈现已写入部分，MUST NOT 把后续普通文本全部吞进错误结构导致整页错乱
