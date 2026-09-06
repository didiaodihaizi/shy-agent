## ADDED Requirements

### Requirement: Composer 加号菜单
空态与聊态 Composer 底部的加号控件 MUST 可点击，并 MUST 打开自绘弹出菜单（MUST NOT 使用原生 `<select>`）。菜单 MUST 至少包含「添加技能」与「添加文件」两项。

#### Scenario: 打开加号菜单
- **WHEN** 用户点击 Composer 加号按钮
- **THEN** 系统 MUST 展示包含「添加技能」「添加文件」的自绘菜单

#### Scenario: 添加技能
- **WHEN** 用户选择「添加技能」并在技能列表中选中一项已启用技能
- **THEN** 输入区顶部 MUST 出现该技能的 chip（同 id 已存在时 MUST NOT 重复添加）

#### Scenario: 添加文件
- **WHEN** 用户选择「添加文件」并在系统对话框中选中一个或多个文件
- **THEN** 输入区顶部 MUST 为每个选中文件出现对应 chip

---

### Requirement: 附件 Chip 展示与移除
Composer MUST 在文本输入区上方展示本轮已挂技能与文件的 chip。技能 chip MUST 显示技能名称；文件 chip MUST 显示文件名。用户 MUST 能通过 chip 上的移除控件去掉单项。发送成功后，本轮 chip MUST 被清空。

#### Scenario: 移除 chip
- **WHEN** 用户点击某技能或文件 chip 的移除控件
- **THEN** 该 chip MUST 从输入区消失，且发送时 MUST NOT 再携带该项

#### Scenario: 发送后清空
- **WHEN** 用户在挂有 chip 的情况下成功发起发送
- **THEN** Composer MUST 清空本轮全部技能与文件 chip

---

### Requirement: 图片 Chip 悬停预览
当文件 chip 对应图片类型时，指针悬停在该 chip 上 MUST 通过 popover 展示该图片的可视预览。非图片文件 MUST NOT 展示图片预览 popover。

#### Scenario: 图片悬停
- **WHEN** 用户将指针悬停在图片文件 chip 上
- **THEN** 系统 MUST 显示包含该图片内容的 popover 预览

#### Scenario: 非图无预览
- **WHEN** 用户将指针悬停在非图片文件 chip 上
- **THEN** 系统 MUST NOT 展示图片预览 popover

---

### Requirement: Slash 与加号技能挂载一致
通过 `/` 命令菜单选择技能时，系统 MUST 将该技能以 chip 形式挂到 Composer（与加号「添加技能」相同），MUST NOT 仅以「使用技能 …」纯文本替换输入框作为唯一挂载方式。

#### Scenario: Slash 选技能
- **WHEN** 用户通过 `/` 菜单选中一项技能
- **THEN** 输入区顶部 MUST 出现对应技能 chip
