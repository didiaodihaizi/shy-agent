## Context

shy 对话框输入区已有 TipTap composer、`ProjectPicker`、会话模型选择与「完全访问」按钮。空状态（问候 + 居中输入）与聊天状态（底栏 dock）共用同一套控件排布。新建项目走原生 select 的「添加项目…」再内联选类型。工具层已有高危确认，但缺少与「默认权限」文案一致的工作空间路径围栏。

约束：简体中文规格；高危删除仍需确认；本轮沙箱 = 路径围栏，非 OS/容器。

## Goals / Non-Goals

**Goals:**
- 空状态 / 聊天状态两套 composer 布局（对齐图一 / 图二结构，无品类 pills）
- 新项目 Modal：素材|代码 + 工作目录
- 「默认权限」popover；开关绑定 `autoApproveTools`
- 模型选择固定宽度
- 默认权限下路径围栏；完全访问解除围栏并免逐条工具确认（沿用现语义）

**Non-Goals:**
- 品类快捷 pills、语音麦克风
- OS seatbelt / AppContainer / Docker 等进程或容器沙箱
- 重做项目数据模型或绑定时机（仍发送时绑定 pending）

## Decisions

### D1：空/聊两套布局，共享逻辑 hooks
- **选择**：拆分空态与聊态 JSX/CSS；状态与发送/模型/权限逻辑仍在 `ChatWorkspace`
- **理由**：视觉差异大，强行一套 CSS 难对齐参考图
- **已考虑 alternative**：仅 CSS 变体 → 控件位置（工作空间在内/外）难表达

### D2：新项目用 Modal
- **选择**：选「添加项目…」打开 Modal（类型 + 选目录 + 确认）
- **理由**：用户明确要求弹窗；信息密度高于内联按钮
- **已考虑 alternative**：保留内联两按钮 → 不符合需求

### D3：权限 popover ↔ autoApproveTools
- **选择**：触发文案「默认权限」；开启后可显示「完全访问」；开关即 `autoApproveTools`
- **理由**：零新设置字段；与设置页语义一致
- **已考虑 alternative**：新权限枚举 → 过度设计

### D4：路径围栏与完全访问联动
- **选择**：`autoApproveTools === false` 时，fs/shell 等解析路径必须落在当前会话项目 root（bound 或 pending）；越界拒绝（或走现有确认，实现时优先拒绝+明确错误）。`true` 时不施加围栏，并保持免逐条确认
- **理由**：对齐本地 Agent 常态；文案「沙箱」可兑现
- **已考虑 alternative**：仅文案无围栏 → 欺骗；OS 沙箱 → 本轮非目标

### D5：模型固定宽
- **选择**：CSS 固定 `model-pill-select` 宽度，文本 ellipsis
- **理由**：最小改动稳住布局

### D6：无项目时的围栏
- **选择**：未选项目时，默认权限仍限制为会话 workspaceDir（若有）或拒绝写绝对越界路径；实现时与现 `resolveWorkspacePath` 对齐并单测锁定
- **理由**：避免无项目时围栏空转

## Risks / Trade-offs

- [Risk] Shell 命令内嵌路径难静态解析 → Mitigation: 围栏优先覆盖明确 path 参数工具（fs_*）；shell 保留高危确认 + 文档说明限制
- [Risk] 完全访问用户误开 → Mitigation: popover 文案说明；开关显眼
- [Risk] 空/聊两套 UI 漂移 → Mitigation: 共享子组件（PermissionPopover、ModelSelect、CreateProjectModal）
- [Trade-off] 路径围栏 ≠ 内核隔离 → 接受理由：业界本地 Agent 第一版常态；OS 沙箱另开 change

## Migration Plan

- 纯前端 + 工具路径校验；无 DB 迁移
- 回滚：恢复旧 ProjectPicker 流程与 full-access 按钮；去掉围栏检查
- 验收：空/聊布局；Modal 建项；popover 开关；默认越界失败、完全访问可越界；模型固定宽

## Open Questions

- Shell 越界：本轮仅依赖既有高危确认，还是对明显绝对路径做启发式拦截（实现时在 tasks 中选定最小方案）
