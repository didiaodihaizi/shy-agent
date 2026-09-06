## ADDED Requirements

### Requirement: Agent 注入块使用 shy-context 标签树
当本轮存在技能摘要、读图结果或非图路径元数据需要注入 agent 上下文时，系统 MUST 将这些增强信息组装为以 `<shy-context>` 为根的标签树（子标签含 `<shy-img>`、`<shy-file>`、`<shy-skill>` 等约定类型），用户原文 MUST 紧随该块之后且 MUST NOT 被包裹进标签。无任何增强时，交给用户模型的本轮用户文本 MUST 仅为用户原文（MUST NOT 输出空的 `<shy-context>`）。标签树 MUST 仅出现在交给用户所选对话模型的 agent 通道中；会话消息落库用于展示的用户内容 MUST NOT 包含这些标签。

#### Scenario: 有读图结果时输出标签
- **WHEN** 本轮成功产生至少一条图片读图纯文本结果并组装 agent 用户上下文
- **THEN** 该上下文 MUST 包含 `<shy-context>` 与至少一个带读图正文的 `<shy-img …>`，且用户原文 MUST 出现在 `</shy-context>` 之后

#### Scenario: 无增强不加空 context
- **WHEN** 本轮无技能、无读图结果、无路径附件需要注入
- **THEN** 交给用户模型的本轮用户文本 MUST 等于用户原文，MUST NOT 包含 `<shy-context>`

#### Scenario: 落库不含标签
- **WHEN** 带附件或技能的用户消息落库用于气泡展示
- **THEN** 落库内容 MUST NOT 包含 `<shy-context>` / `<shy-img>` / `<shy-file>` / `<shy-skill>` 标签

---

## MODIFIED Requirements

### Requirement: 非图附件与技能摘要注入
非图片附件 MUST 仅以路径与元数据形式进入本轮 agent 上下文（经由 `<shy-file>` 等约定标签），MUST NOT 在本期将整文件内容强制灌入上下文。挂载的技能 MUST 注入名称与摘要级信息（经由 `<shy-skill>`），并 MUST 允许 Agent 通过既有技能相关能力再读取完整 `SKILL.md`。

#### Scenario: 非图只附路径
- **WHEN** 用户附上非图片文件并发送
- **THEN** 本轮 agent 上下文 MUST 包含该文件的路径类引用信息（`<shy-file>`），MUST NOT 要求把整文件字节作为用户模型的默认输入正文

#### Scenario: 技能摘要
- **WHEN** 用户挂有技能 chip 并发送
- **THEN** 本轮 agent 上下文 MUST 包含该技能的可识别摘要信息（至少含名称，经由 `<shy-skill>`）
