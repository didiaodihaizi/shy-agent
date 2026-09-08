## ADDED Requirements

### Requirement: 从持久化历史还原时间轴
当会话历史中包含已持久化的 tool / reasoning 过程消息时，Agent 时间轴 UI MUST 按消息顺序展示对应轻量行与思考片段，行为 MUST 与实时流式组装时的结构一致（图标、动作标签、可展开详情），MUST NOT 仅把过程信息折叠成不可区分的纯文本块。

#### Scenario: 历史加载含工具行
- **WHEN** 打开会话且历史消息含至少一条 tool 过程消息
- **THEN** 时间轴 MUST 显示对应工具行（含动作标签；有参数摘要时展示次要灰字）

#### Scenario: 历史加载含思考穿插
- **WHEN** 历史中在工具行之间存在 reasoning 过程消息
- **THEN** UI MUST 在对应顺序展示思考片段
