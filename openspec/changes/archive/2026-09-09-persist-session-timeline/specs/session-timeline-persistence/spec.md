## ADDED Requirements

### Requirement: 过程态消息持久化
系统 MUST 将 Agent 回合的过程态消息持久化到会话存储（SQLite `session_messages`），至少包括：工具调用行（含可关联的 toolId 与状态）、reasoning/深度思考定稿、assistant 定稿正文。系统 MUST NOT 要求将 `assistant_delta` / `reasoning_delta` 的逐字流式增量全部落盘。

#### Scenario: 工具调用落盘
- **WHEN** 主进程发出一次带稳定 id 的 `tool_call`
- **THEN** 系统 MUST 在该会话下持久化对应 tool 消息（可含 input 与 running 状态），使得进程重启后仍可加载

#### Scenario: 工具结果更新同一行
- **WHEN** 随后发出同一 id 的 `tool_result`
- **THEN** 系统 MUST 更新同一条持久化 tool 消息的结果与终态（done/failed），MUST NOT 无关联地再插入无法合并的重复顶层行

#### Scenario: 助手定稿落盘
- **WHEN** 主进程发出完整 `assistant`（非 delta）内容
- **THEN** 系统 MUST 将该正文持久化为 assistant 消息

#### Scenario: 流式增量不强制落盘
- **WHEN** 仅收到 `assistant_delta` 且尚未定稿
- **THEN** 系统 MUST NOT 因本要求而把每个 delta 单独持久化为独立消息行

---

### Requirement: 重启后可重建时间轴
系统 MUST 在加载会话历史时返回足以重建轻量时间轴的过程消息（含 role 与必要 meta）。客户端 MUST 能据此展示工具行与思考穿插，MUST NOT 仅因重启而只剩 user/assistant 纯文本、完全丢失过程结构。

#### Scenario: 重启后打开含工具的会话
- **WHEN** 用户完成至少一次含工具调用的对话后退出并重新启动应用，再打开同一会话
- **THEN** UI MUST 展示该次过程中的工具相关行与已定稿助手内容（在数据已按本规格落盘的前提下）

#### Scenario: 旧消息兼容
- **WHEN** 加载在本能力上线前写入、无过程 meta 的历史消息
- **THEN** 系统 MUST 仍能展示原有 user/assistant 内容，MUST NOT 因缺少 meta 而加载失败

---

### Requirement: 过程消息元数据
持久化的 tool / reasoning 消息 MUST 携带足够元数据（例如 toolId、toolName、status、input/result 摘要或全文策略、reasoning 时长等），以便客户端还原现有时间轴交互（展开详情、状态点等）。元数据编码格式由实现选择，但 MUST 可在分页读取 API 中一并返回。

#### Scenario: 分页读取含 meta
- **WHEN** 客户端请求会话消息分页且存在 tool 过程消息
- **THEN** 返回的消息条目 MUST 包含角色与可用于还原工具行的元数据字段（或等价结构）
