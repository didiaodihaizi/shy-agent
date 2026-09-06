## ADDED Requirements

### Requirement: 默认权限 popover
系统 MUST 提供「默认权限」触发控件；激活后 MUST 展示 popover，说明默认权限下操作受安全约束、超出范围需请求允许，并提供「允许完全访问」开关。该开关 MUST 读写既有 `autoApproveTools`（或等价设置），行为与设置页完全访问一致。

#### Scenario: 打开 popover 查看说明与开关
- **WHEN** 用户点击「默认权限」
- **THEN** 展示说明文案与「允许完全访问」开关，开关状态反映当前 `autoApproveTools`

#### Scenario: 开启完全访问
- **WHEN** 用户打开「允许完全访问」开关
- **THEN** `autoApproveTools` 被设为 true，工具确认闸门按既有完全访问语义放行

#### Scenario: 关闭恢复默认
- **WHEN** 用户关闭「允许完全访问」开关
- **THEN** `autoApproveTools` 为 false，恢复默认权限约束（含路径围栏与逐条确认策略）
