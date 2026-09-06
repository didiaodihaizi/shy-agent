# composer-workspace-sandbox Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or `/opsx:apply` task-by-task.

**Goal:** 对齐空/聊两套 composer、新项目 Modal、默认权限 popover，并以工作空间路径围栏兑现「默认权限」沙箱语义。

**Architecture:** UI 层拆分空态/聊态 JSX，共享 `CreateProjectModal`、`PermissionPopover`、模型 Select。工具层在 fs_* 路径解析处读取 `autoApproveTools`，默认施加 root 围栏。

**Tech Stack:** Electron + React + 现有 settings/IPC；vitest。

---

## Task 1: 路径围栏

- [ ] **Step 1:** 在 `src/main/agent/tools/`（或 paths 工具模块）新增 `assertPathInRoot(target, root)` 纯函数与测试
- [ ] **Step 2:** `fs_read`/`fs_write`/`fs_delete` 在 `autoApproveTools !== true` 时调用围栏；错误信息中文明确
- [ ] **Step 3:** 跑 vitest；提交点：`feat(agent): 默认权限下 fs 路径围栏`

## Task 2: CreateProjectModal + ProjectPicker

- [ ] **Step 1:** 新增 Modal 组件（类型 radio/seg、路径展示、选文件夹、确认）
- [ ] **Step 2:** 改造 `ProjectPicker` 打开 Modal；复用 `createProject`/`pickFolder`
- [ ] **Step 3:** 提交点：`feat(ui): 新建项目改为 Modal 选择类型与目录`

## Task 3: PermissionPopover

- [ ] **Step 1:** 实现 popover UI + Switch；读写 `getSettings`/`setSettings.autoApproveTools`
- [ ] **Step 2:** 替换 `full-access` 按钮；空/聊共用
- [ ] **Step 3:** 提交点：`feat(ui): 默认权限 popover 替代完全访问按钮`

## Task 4: 双布局 + 模型固定宽

- [ ] **Step 1:** `ChatWorkspace` 按 `hasConversation` 渲染两套 bar/footer
- [ ] **Step 2:** CSS 固定 `.model-pill-select` 宽度；空态外置 project picker
- [ ] **Step 3:** 手工对照图一/图二；提交点：`feat(ui): 空状态与聊天状态 composer 分布局`

## Task 5: 验收

- [ ] **Step 1:** `npm run typecheck` + 相关 vitest
- [ ] **Step 2:** 更新 `tasks.md` 勾选；准备 `/opsx:verify`
