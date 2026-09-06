<!--
Raw capture of superpowers:brainstorming output.
决策日志：composer 空/聊布局 + 新项目弹窗 + 默认权限 popover + 路径围栏沙箱。
-->

# Brainstorm：composer-workspace-sandbox

## 背景

用户对照参考图要求改造对话框：
1. 选择「新项目」应弹窗：选素材/代码 + 工作目录（现状是 select 内联按钮再 pickFolder）
2. 模型选择框固定宽度
3. 图一 = 空状态输入布局；图二 = 聊天状态布局
4. 「默认权限」popover（文案 +「允许完全访问」开关）
5. 「真实沙箱」——经调研本地 Agent 常态后，采纳 **路径围栏 + 确认闸门**（非 OS seatbelt / 容器）

现状要点：
- `ChatWorkspace` 空/聊共用 `composerInner`；`ProjectPicker` 为原生 select + 内联类型按钮
- `autoApproveTools` /「完全访问」已存在，对应图中开关
- 工具已有部分确认闸门，缺统一「工作空间路径围栏」

## 决议链

| # | 问题 | 决议 |
|---|------|------|
| Q1 | 改动范围 | **方案 2**：新项目弹窗 + 固定模型宽 + 空/聊两套布局；**不做**品类 pills |
| Q2 | 「默认权限」 | 做成参考图 popover；开关 ↔ 现有 `autoApproveTools` |
| Q3 | 沙箱级别 | **路径围栏**（默认限工作空间；完全访问解除）+ 现有高危确认；不做 OS/容器本轮 |
| Q4 | 流程 | `/opsx:propose` → apply |

## 设计取捨

- **空状态**：居中大 composer；底栏外「选择工作空间」+「默认权限」；框内 + / 模型 / 发送
- **聊天状态**：紧凑 dock；框内 + + 默认权限 | 模型 / 发送·停止；不展示工作空间选择（已绑定则本就隐藏）
- **新项目 Modal**：类型（素材|代码）+ 选目录 + 确认 → `createProject` + 设 pending
- **路径围栏**：`autoApproveTools === false` 时 fs/shell 等路径解析限制在 bound/pending project root；越界拒绝或确认。开启完全访问后解除围栏并免逐条工具确认（沿用现语义）
- **非目标**：麦克风、品类 pills、真实内核沙箱、Docker

## 依赖

| 项 | 状态 |
|----|------|
| ProjectPicker / createProject / pickFolder | ready |
| autoApproveTools settings | ready |
| resolveWorkspacePath / 工具确认 | ready，需扩展围栏 |
| OS sandbox | out of scope |

## 验收（口头）

- 空态与聊态布局区分符合图一/图二结构（无 pills）
- 添加项目走 Modal（类型 + 目录）
- 模型 pill 固定宽
- 默认权限 popover 开关生效
- 默认权限下越界路径被拦；完全访问可越界
