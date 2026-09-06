## ADDED Requirements

### Requirement: 多模态会话模型当轮透传图片
当发送请求含 `kind` 为图片的附件，且当前会话所选对话模型经启发式判定具备视觉能力时，系统 MUST 在调用该模型的 agent 循环中，将本轮图片以多模态输入（等价于 OpenAI-compatible 的 `image_url`，可由本机文件读取为 data URL）附在本轮用户消息上。系统 MUST NOT 在调用该会话模型之前，另选 vision 模型对图片做预读 OCR 并将读图纯文本作为进入 agent 的前置步骤。

#### Scenario: 会话模型支持 vision 时透传
- **WHEN** 用户发送含图片附件且会话模型被判定为支持 vision
- **THEN** 面向该会话模型的本轮请求 MUST 包含对应图片的多模态输入，且 MUST NOT 先阻塞于独立预读 OCR 步骤

#### Scenario: 落库仍无二进制
- **WHEN** 带图片的用户消息落库用于气泡展示
- **THEN** 落库用户内容 MUST 仍为用户原文（及展示用 meta），MUST NOT 将图片二进制写入消息正文

---

### Requirement: 非 vision 会话模型仅路径降级
当发送请求含图片附件，但当前会话所选对话模型经启发式判定不具备视觉能力时，系统 MUST 将这些图片以路径与元数据形式纳入本轮 agent 文本上下文，MUST 继续发送流程，MUST NOT 另选 vision 模型做预读 OCR，MUST NOT 仅因模型不支持 vision 而拦截整次发送。

#### Scenario: 不支持 vision 时只附路径
- **WHEN** 用户发送含图片但会话模型判定为不支持 vision
- **THEN** 本轮 agent 文本上下文 MUST 包含这些图片的路径类引用，MUST NOT 执行独立预读 OCR，且 MUST 继续进入 agent 循环

---

## MODIFIED Requirements

### Requirement: 非图附件与技能摘要注入
非图片附件 MUST 仅以路径与元数据形式进入本轮 agent 上下文，MUST NOT 在本期将整文件内容强制灌入上下文。挂载的技能 MUST 注入名称与摘要级信息，并 MUST 允许 Agent 通过既有技能相关能力再读取完整 `SKILL.md`。图片附件在会话模型支持 vision 时 MUST 按「多模态会话模型当轮透传图片」处理；在不支持时 MUST 按「非 vision 会话模型仅路径降级」处理。

#### Scenario: 非图只附路径
- **WHEN** 用户附上非图片文件并发送
- **THEN** 本轮 agent 上下文 MUST 包含该文件的路径类引用信息，MUST NOT 要求把整文件字节作为用户模型的默认输入正文

#### Scenario: 技能摘要
- **WHEN** 用户挂有技能 chip 并发送
- **THEN** 本轮 agent 上下文 MUST 包含该技能的可识别摘要信息（至少含名称）

---

## REMOVED Requirements

### Requirement: 发送前读图再交给用户模型

**Reason**: 与多模态透传冲突；预 OCR 造成卡顿且阻止会话模型直接看图。

**Migration**: 改用「多模态会话模型当轮透传图片」与「非 vision 会话模型仅路径降级」。

### Requirement: 无 Vision 或读图失败时降级

**Reason**: 不再有独立预读 OCR；失败/不支持场景由路径降级与 API 错误透出覆盖。

**Migration**: 不支持 vision → 路径降级；透传后的 API 错误按既有 agent error 通道展示。
