## Context

`composer-plus-attachments` 已落地：读图 → 纯文本注入 → 用户模型不收原图；落库用 `displayMessage`（原文 + meta），agent 用加工后的 `message`。加工文目前由 `buildAttachmentContext` 用中文 `【…】` 分段拼接。本 change 只替换该拼接形态为标签树，不改双通道落库策略。

## Goals / Non-Goals

**Goals:**
- Agent 侧注入块统一为 `<shy-context>` + 分类型子标签
- 用户原文紧随其后且不包裹；无增强时不加空 context
- 单测覆盖各组合；现有「气泡不展示加工文」行为不变

**Non-Goals:**
- 不改 system / react / 短期记忆等其它 `【】` 提示词块
- 不改消息表结构；不做「单串落库再剥标签」
- 不引入完整 XML 解析器；不做用户手打同名标签的对抗性清洗（标签不进落库即可）

## Decisions

### D1：标签只用于 agent 通道
- **选择**：库/UI 仍 `displayMessage`；标签只出现在交给 LLM 的 `message`
- **理由**：展示 = 用户所发；避免剥标签误伤用户正文
- **已考虑 alternative**：单串落库剥标签 → 用户手打冲突与旧消息兼容成本高

### D2：统一根 + 分类型子标签
- **选择**：
  ```text
  <shy-context>
  <shy-img path="…" name="…">读图结果</shy-img>
  <shy-file path="…" name="…" mime="…"/>
  <shy-skill id="…" name="…">可选摘要</shy-skill>
  </shy-context>

  用户原文
  ```
- **理由**：整段可识别、按类型可裁；比单一大袋子更可演进
- **已考虑 alternative**：仅 `<shy-inject>` 袋子；并列无根子标签

### D3：用户原文不包 `<shy-user>`
- **选择**：原文跟在 `</shy-context>` 后的自然文本
- **理由**：少 token；注入边界已由根标签给出
- **已考虑 alternative**：包 `<shy-user>` → 更严分隔但啰嗦

### D4：轻量转义、无 XML 库
- **选择**：属性值与标签正文对 `& < > "` 做最小转义/反转义辅助函数（可放在 attachments 旁小模块）
- **理由**：内容来自读图/路径/技能摘要，可控；避免新依赖
- **已考虑 alternative**：引入 XML 库 → 过重

### D5：旧中文分段
- **选择**：组装路径不再产出 `【图片读图结果】` 等；展示侧 `stripAgentContextForDisplay` 可继续兼容历史误入库消息
- **理由**：新消息走标签；旧气泡仍可读

## Risks / Trade-offs

- [Risk] 读图正文含未转义 `<` 破坏标签 → Mitigation: 正文转义
- [Risk] 模型忽略标签语义 → Mitigation: 标签名直观；必要时在 system 侧另开 change 说明（本期不做）
- [Trade-off] 历史轮次若只存 display，后续轮次 LLM 看不到旧读图标签 → 接受（与当前双通道一致；本 change 不扩大存储）

## Migration Plan

- N/A — 无 DB/部署变更；发版后新发送即用标签格式
- Rollback：回退 `buildAttachmentContext` 即可
- 验收：带图发送气泡无标签/无旧标题；agent 输入含 `<shy-context>` 与读图正文

## Open Questions

- 无阻塞项。若后续要把标签约定写进 system prompt，另开 change。
