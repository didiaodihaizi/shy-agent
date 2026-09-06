## ADDED Requirements

### Requirement: 默认权限下的工作空间路径围栏
当 `autoApproveTools` 为 false（默认权限）时，系统 MUST 对带显式文件系统路径参数的 Agent 工具（至少包括 `fs_read` / `fs_write` / `fs_delete` 或等价）校验目标路径：解析后 MUST 落在当前会话关联的项目 root（已绑定或 pending）或会话 workspace 根之内。越界路径 MUST 被拒绝并返回明确错误，MUST NOT 静默执行。

当 `autoApproveTools` 为 true（完全访问）时，系统 MUST NOT 施加上述路径围栏（高危删除等既有产品闸门仍可按原策略生效）。

#### Scenario: 默认权限拒绝越界写文件
- **WHEN** 默认权限下 Agent 调用写文件工具，路径解析后位于项目 root 之外
- **THEN** 操作失败，返回越界/权限类错误，磁盘不被写入

#### Scenario: 默认权限允许项目内路径
- **WHEN** 默认权限下 Agent 读写项目 root 内相对或绝对路径
- **THEN** 路径校验通过，按既有工具逻辑执行（其他确认闸门仍可适用）

#### Scenario: 完全访问可越界
- **WHEN** 已开启完全访问且 Agent 访问项目 root 外路径
- **THEN** 路径围栏不拦截该请求（仍可受其他高危确认策略约束）
