## Why

Composer 的 `+` 仍是禁用占位，用户无法在发送前挂技能与本机文件；现有 `/` 选技能只往正文塞提示语，既不直观也不支持图片读图。需要 chip 式附件体验，并在发送前用当前 provider 的 vision 模型读图，再把结果交给用户所选对话模型。

## What Changes

**Composer `+` 与 chip**
- From: `+` disabled；技能仅经 `/` 写入「使用技能…」正文
- To: `+` 打开自绘菜单（添加技能 / 添加文件）；技能与文件以 chip 展示于输入区顶部；图片 chip hover 预览；`/` 选技能也写入 chip
- Reason: 对齐参考交互，统一挂载入口
- Impact: non-breaking（UI + ChatRequest 扩展）

**发送前读图预处理**
- From: `ChatRequest` 仅文本，无附件/技能结构化字段
- To: 扩展 `skills` / `attachments`；发送前自动选 vision 模型读图，将 `imageNotes` + 技能摘要 + 非图路径元数据注入本轮上下文后再 `runAgent`
- Reason: 用户明确要求「多模态读图 → 再交给所选模型」
- Impact: non-breaking；无 vision 时图片降级为路径附件

## Capabilities

### New Capabilities
- `composer-plus-menu`: Composer `+` 菜单、技能/文件选择与 chip 展示（含图片 hover 预览）
- `chat-attachment-pipeline`: ChatRequest 附件/技能字段、发送前读图选型与上下文组装

### Modified Capabilities
- （无）本期不修改已归档 capability 的既有 MUST 条文；行为增量落在上述新 capability。

## Impact

- renderer：`ChatWorkspace` composer、自绘 popover、chip、图片 preview
- preload / shared：`ChatRequest` 类型；文件多选 IPC（扩展 `pickFile` 或新 API）
- main：agent 发送前预处理、vision 启发式选型、一次多模态 completion（custom / opencode-go）
- 依赖：现有 `listSkills` / `readSkill`、文件系统对话框、OpenAI-compatible chat completions
