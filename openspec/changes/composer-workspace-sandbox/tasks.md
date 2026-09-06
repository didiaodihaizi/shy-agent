## 1. 路径围栏

- [x] 1.1 实现 `assertWithinWorkspace`（或扩展 `resolveWorkspacePath`）：默认权限下校验目标路径属于项目/workspace root
- [x] 1.2 将围栏接入 `fs_read` / `fs_write` / `fs_delete`（读取 `autoApproveTools`）；完全访问跳过围栏
- [x] 1.3 单元测试：项目内通过、越界拒绝、完全访问放行

## 2. 新项目 Modal 与 ProjectPicker

- [x] 2.1 实现 `CreateProjectModal`（类型素材|代码、选目录、确认/取消）
- [x] 2.2 `ProjectPicker`：「添加项目…」改为打开 Modal；成功后 onChange + refresh
- [x] 2.3 相关组件测试或最小交互断言

## 3. 默认权限 popover

- [x] 3.1 实现 `PermissionPopover`（说明文案 +「允许完全访问」Switch ↔ settings）
- [x] 3.2 替换 ChatWorkspace 中「完全访问」按钮；空态与聊态共用

## 4. Composer 双布局 + 模型固定宽

- [x] 4.1 拆分空状态 / 聊天状态 composer 排布（工作空间外置 vs 框内权限）
- [x] 4.2 CSS：模型选择固定宽度 + ellipsis；对齐图一/图二结构（无 pills）
- [ ] 4.3 目测/手工清单：空态、聊态、Modal、popover、围栏

## 5. 收尾

- [x] 5.1 typecheck / 相关 vitest 通过
