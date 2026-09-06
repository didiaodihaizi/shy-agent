## ADDED Requirements

### Requirement: 新建项目经 Modal 完成
系统 MUST 在用户选择「添加项目」时打开 Modal（或等价对话框），而非仅依赖内联类型按钮条作为唯一流程。Modal MUST 允许选择项目类型（素材或代码）以及工作目录，确认后 MUST 创建项目并将当前会话的待绑定项目设为新建结果（或等价 pending 绑定行为）。

#### Scenario: 选择添加项目打开弹窗
- **WHEN** 用户在工作空间/项目选择中选择添加项目
- **THEN** 系统展示包含类型与工作目录选择的 Modal

#### Scenario: 确认后创建并选中
- **WHEN** 用户在 Modal 中选定类型与合法目录并确认
- **THEN** 项目被创建，列表刷新，当前会话 pending/选中项目为该新项目，Modal 关闭

#### Scenario: 取消不创建
- **WHEN** 用户关闭或取消 Modal
- **THEN** MUST NOT 创建新项目，原选择保持不变
