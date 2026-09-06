## Why

空状态与聊天状态共用同一 composer，项目添加流程简陋，「完全访问」按钮也不符合参考图的「默认权限」popover。用户期望对齐两套输入布局、新项目弹窗，以及默认权限下的工作空间路径围栏（本地 Agent 常态沙箱）。现在补齐壳层交互与围栏，才能让「默认权限 / 完全访问」文案与真实约束一致。

## What Changes

**Composer 空/聊布局**
- From: 空状态与聊天状态共用同一 `composerInner` 底栏
- To: 空状态（图一结构：大输入 + 外置工作空间/权限）；聊天状态（图二：框内 +/权限 | 模型/发送）
- Reason: 对齐产品参考交互
- Impact: non-breaking；仅 UI

**新项目弹窗**
- From: select「添加项目…」→ 内联类型按钮 → 直接选文件夹
- To: Modal 内选素材/代码 + 工作目录后创建并绑定
- Reason: 一步说清类型与目录
- Impact: non-breaking

**默认权限 popover**
- From: 工具栏「完全访问」切换按钮
- To: 「默认权限」触发器 + popover（说明文案 +「允许完全访问」开关 ↔ `autoApproveTools`）
- Reason: 对齐参考图与权限语义
- Impact: non-breaking

**模型选择固定宽**
- From: 宽度随模型名变化
- To: 固定宽度，过长省略
- Reason: 布局稳定
- Impact: non-breaking

**工作空间路径围栏**
- From: 无统一「仅工作空间」路径约束（仅有高危确认）
- To: `autoApproveTools === false` 时工具路径限制在当前项目 root；开启完全访问后解除
- Reason: 本地 Agent 常态沙箱第一版
- Impact: non-breaking；默认更严

## Capabilities

### New Capabilities
- `composer-layout-modes`: 空状态与聊天状态两套 composer 布局与控件位置
- `project-create-modal`: 新建项目 Modal（类型 + 工作目录）
- `permission-popover`: 默认权限 popover 与完全访问开关
- `workspace-path-fence`: 默认权限下的工作空间路径围栏

### Modified Capabilities
<!-- 无已归档主规格需 delta；以本 change specs 为准 -->

## Impact

- `ChatWorkspace` / `ProjectPicker` / composer 样式
- Settings `autoApproveTools` 暴露方式（行为不变）
- Agent 工具路径解析（`resolveWorkspacePath`、fs/shell 等）
- 不做：品类 pills、麦克风、OS seatbelt/容器
