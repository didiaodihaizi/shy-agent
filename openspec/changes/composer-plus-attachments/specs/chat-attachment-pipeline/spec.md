## ADDED Requirements

### Requirement: ChatRequest 携带技能与附件
发起对话时，客户端 MUST 能在 `ChatRequest` 中结构化携带零个或多个技能引用与本机附件（含路径、显示名、mime/类型）。用户正文仍由 `message` 字段承载。

#### Scenario: 带附件发送
- **WHEN** 用户挂有至少一个技能或文件 chip 并发送
- **THEN** 请求 MUST 包含对应的结构化 `skills` / `attachments` 字段，且 MUST 包含用户输入正文（若非空）

---

### Requirement: 发送前读图再交给用户模型
对 `kind` 为图片的附件，系统 MUST 在调用用户所选对话模型的 agent 循环之前，使用当前 provider 下按启发式选出的 vision 能力模型完成读图，并将读图得到的纯文本结果注入本轮上下文。用户所选对话模型的请求 MUST NOT 被要求直接携带原始图片二进制（或等价 `image_url` 作为该模型的输入）。

#### Scenario: 有 vision 时读图
- **WHEN** 发送请求含图片附件且当前 provider 能选出可用 vision 模型
- **THEN** 系统 MUST 先完成读图，并将读图文本纳入随后交给用户所选模型的本轮上下文

#### Scenario: 用户模型不收原图
- **WHEN** 读图成功后开始用户所选模型的 agent 循环
- **THEN** 该循环面向用户模型的消息组装 MUST NOT 依赖把原图作为该模型的多模态输入

---

### Requirement: 无 Vision 或读图失败时降级
当无法选出 vision 模型或某张图片读图失败时，该图片 MUST 降级为普通文件附件（路径与元数据），系统 MUST 给出轻量提示，且 MUST NOT 仅因单张读图失败而阻断整次发送（在仍有可发送正文或其他附件/技能时）。

#### Scenario: 无 vision 降级
- **WHEN** 发送含图片但当前 provider 无可用 vision 模型
- **THEN** 系统 MUST 将该图片按路径附件处理，MUST 提示用户，并且 MUST 继续发送流程

#### Scenario: 单张失败不阻断
- **WHEN** 多张图片中有一张读图失败、其余成功或可降级
- **THEN** 系统 MUST 继续发送，失败项按路径附件降级

---

### Requirement: 非图附件与技能摘要注入
非图片附件 MUST 仅以路径与元数据形式进入本轮上下文，MUST NOT 在本期将整文件内容强制灌入上下文。挂载的技能 MUST 注入名称与摘要级信息，并 MUST 允许 Agent 通过既有技能相关能力再读取完整 `SKILL.md`。

#### Scenario: 非图只附路径
- **WHEN** 用户附上非图片文件并发送
- **THEN** 本轮上下文 MUST 包含该文件的路径类引用信息，MUST NOT 要求把整文件字节作为用户模型的默认输入正文

#### Scenario: 技能摘要
- **WHEN** 用户挂有技能 chip 并发送
- **THEN** 本轮上下文 MUST 包含该技能的可识别摘要信息（至少含名称）
