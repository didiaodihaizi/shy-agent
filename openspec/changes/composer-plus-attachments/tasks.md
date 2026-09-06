## 1. 类型与 IPC

- [x] 1.1 扩展 `ChatRequest`：`skills?`、`attachments?`（path/name/mime/kind）；更新 preload 类型
- [x] 1.2 新增或扩展文件多选 IPC（`pickFiles`），返回多个本机路径
- [x] 1.3 单测：类型/序列化或 preload 契约不回归

## 2. 读图与上下文组装（main）

- [x] 2.1 实现 vision 模型启发式选型（当前 provider 列表 / 白名单 / id 含 vision）
- [x] 2.2 实现图片读图 completion（多模态 → 纯文本 notes）；失败可降级
- [x] 2.3 在 `agentChat` / `runAgent` 前组装：技能摘要 + 非图路径元数据 + imageNotes + 用户正文
- [x] 2.4 单测：选型、降级、上下文拼装关键路径

## 3. Composer UI

- [ ] 3.1 启用 `+`：自绘菜单「添加技能」「添加文件」
- [ ] 3.2 技能二级列表（可搜索、已启用）；文件走多选对话框
- [ ] 3.3 Chip 行：技能/文件展示、移除、发送成功清空；样式对齐参考图
- [ ] 3.4 图片 chip hover popover 预览
- [ ] 3.5 `/` 选技能改为挂 skill chip（不再仅塞「使用技能」正文）
- [ ] 3.6 `onSend` 把 skills/attachments 写入 `chat` 请求；读图中状态提示

## 4. 验收

- [ ] 4.1 相关 vitest 通过；手动：多技能多文件、图 hover、有/无 vision、发送后清空 chip
