<!--
Raw capture of superpowers:brainstorming output.
对话已收敛；以下为 decision log。
-->

# shy-context-tags — brainstorm capture

## 背景

附件/技能注入当前用中文分段标题（`【图片读图结果】` / `【挂载技能】` / `【附件路径】` / `【用户消息】`）拼进 agent 上下文。展示侧已与落库分离：`displayMessage` 存用户原文 + meta，加工文只进 LLM。用户希望用自定义标签统一管理注入块，便于机器边界识别，同时继续把相关信息告诉大模型。

## 决议链

### Q1：标签用在哪一层？
- 选项：① 只规范给模型的注入块（库/UI 仍原文）② 单串落库展示剥标签 ③ 两者都用
- **决定：①**

### Q2：标签形态？
- 选项：A 统一根 `<shy-context>` + 分类型子标签；B 单个 `<shy-inject>` 大袋子；C 并列顶格子标签无根
- **决定：A**

### Q3：用户原文是否包 `<shy-user>`？
- **决定：不包**。注入块有根标签即可；原文跟在 `</shy-context>` 后保持自然。

## 设计要点（已批准）

```text
<shy-context>
<shy-img path="…" name="…">读图结果</shy-img>
<shy-file path="…" name="…" mime="…"/>
<shy-skill id="…" name="…">可选摘要</shy-skill>
</shy-context>

用户原文
```

- 无增强时不加空 context，整段即用户原文
- 属性双引号；正文 `<` 等简单转义
- 落库/气泡不变：`displayMessage`；标签只进 agent `message`
- Out：不改 system/react 其它 `【】`；不改消息表；不做单串落库剥标签
- 旧 `【…】` 展示兜底剥离可保留

## 验收（口头）

- 带图发送：气泡 = 原文 + 图；库无 `<shy-` / 无 `【图片读图结果】`
- 同轮 LLM 输入含 `<shy-context>` / `<shy-img>` 与读图正文
- `buildAttachmentContext` 单测覆盖仅图/仅文件/仅技能/混合/无增强
