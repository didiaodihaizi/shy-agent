## Context

shy Composer 空态/聊态底部已有 `composer-plus`，当前 `disabled`。技能经 slash 菜单以纯文本提示注入；文件选择仅用于素材库等场景。`ChatRequest` 为 `{ sessionId, message, mode, … }` 文本通道。用户需要参考图中的 chip 体验，以及「vision 读图 → 用户模型」两段式流水线。

约束：自绘控件（非原生 `<select>`）；技能/文件均可多个；非图不整文件灌上下文；不新增独立视觉模型设置项。

## Goals / Non-Goals

**Goals:**
- 启用 `+`：添加技能 / 添加文件，chip 展示与移除
- 图片 chip hover 预览实图
- 发送时结构化携带 skills + attachments；读图后把文本结果交给用户所选模型
- `/` 与 `+` 技能挂载统一为 chip

**Non-Goals:**
- 独立「视觉模型」设置页
- 历史消息富媒体附件气泡
- 非图文件整文件注入上下文
- 麦克风等其它 `+` 项
- 用户对话模型请求直接携带 `image_url`

## Decisions

### D1：附件 UX 为 chip 而非仅正文
- **选择**：输入区顶部 chip 行；`+` 自绘 popover
- **理由**：对齐参考图；可移除、可多选
- **已考虑 alternative**：只改 `/` 文案 — 无法挂文件与预览

### D2：发送前读图预处理，而非直送用户模型
- **选择**：main 在 `runAgent` 前对图片调 vision completion，得到 `imageNotes` 纯文本再组装上下文
- **理由**：用户明确要求读图结果交给所选模型；所选模型可能无 vision
- **已考虑 alternative**：直送 `image_url`；运行中靠工具读图 — 均不符流水线

### D3：Vision 模型自动选型
- **选择**：从当前 provider 模型列表按启发式挑选（id 含 `vision` / 已知白名单等）；opencode-go 优先 `*-vision*`
- **理由**：用户选 B，避免再配一套设置
- **已考虑 alternative**：独立视觉模型配置 — 本期非目标

### D4：无 vision / 读图失败时降级
- **选择**：该附件降级为路径+元数据，轻提示，不阻断整单（除非无可发送内容）
- **理由**：可用性优先
- **已考虑 alternative**：硬阻止发送 — 过严

### D5：非图与技能注入深度
- **选择**：非图只附路径+mime；技能注入 name+description/摘要，全文可工具再读
- **理由**：控 token；与现有 fs/skill 工具一致
- **已考虑 alternative**：整文件/全文灌入 — 易爆上下文

### D6：用户显式附件不受 workspace 路径围栏拦截读图
- **选择**：用户经对话框选中的绝对路径，读图/登记允许读取（与「用户主动附上」一致）
- **理由**：附件常在仓库外（截图、下载目录）
- **已考虑 alternative**：强制复制进 workspace — 增加拷贝与权限复杂度，可后续做

## Risks / Trade-offs

- [Risk] Vision 启发式误选无视觉能力的模型 → Mitigation: 失败即降级路径附件；白名单+关键字双保险
- [Risk] 多图读图延迟拉长首包 → Mitigation: 串行/有限并发 +「正在理解图片…」状态；可后续做进度
- [Risk] 大图超 API 限制 → Mitigation: 压缩/缩略后再发；失败降级
- [Trade-off] 用户模型看不到原图像素，只见读图文本 → 接受：符合用户指定流水线
- [Trade-off] 历史消息不存富媒体预览 → 接受：本期 Non-Goal

## Migration Plan

N/A — 无 DB schema 迁移；旧客户端忽略新字段。发布后空态/聊态 `+` 同时启用。Rollback：禁用 `+`、忽略 `skills`/`attachments` 即可回退行为。

## Open Questions

- custom provider 无模型列表 API 时，vision 启发式仅靠「当前 model id 是否含 vision」是否足够（可在实现时用会话 model + 设置 defaultModel 探测，不足则降级）
- 文件多选：扩展现有 `pickFile` vs 新 `pickFiles` IPC（实现时二选一，推荐 `pickFiles` 多选）
