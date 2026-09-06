# shy-context-tags Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development
> or `/opsx:apply` to implement this plan task-by-task.

**Goal:** 将附件/技能注入从中文 `【】` 分段改为 `<shy-context>` 标签树，且仅出现在 agent 通道。

**Architecture:** `buildAttachmentContext` 负责拼装；可选小模块做属性/正文转义。落库仍用 `displayMessage`（原文 + meta），`runAgent` 在 history 中把当轮 display 替换为带标签的 agent message。展示侧无需解析新标签。

**Tech Stack:** TypeScript、vitest；无新依赖。

**工作目录:** `.worktrees/composer-plus-attachments`

---

## Task 1: 转义 + buildAttachmentContext

**Files:**
- Create: `src/main/agent/attachments/shy-context-escape.ts`（或同目录极小 util）
- Modify: `src/main/agent/attachments/build-context.ts`
- Modify: `src/main/agent/attachments/build-context.test.ts`
- Test: `npx vitest run src/main/agent/attachments/build-context.test.ts --coverage.enabled=false`

- [ ] **Step 1:** 为期望输出写失败测试：混合输入产出含 `<shy-context>`、`<shy-img path=… name=…>`、读图正文、`</shy-context>` 后接用户原文；无增强时等于原文；正文含 `<` 时已转义
- [ ] **Step 2:** 跑测试确认失败
- [ ] **Step 3:** 实现转义 + 改写 `buildAttachmentContext`（不再产出 `【…】`）
- [ ] **Step 4:** 跑测试至通过
- [ ] **Step 5:** Commit（中文）：`feat(agent): 附件注入改用 shy-context 标签`

## Task 2: 调用方断言对齐

**Files:**
- Modify: `src/main/agent/service.test.ts`（及任何仍断言 `【图片读图结果】` 的测试）
- Test: `npx vitest run src/main/agent/service.test.ts src/main/agent/attachments --coverage.enabled=false`

- [ ] **Step 1:** 全局搜 `【图片读图结果】` / `【挂载技能】` / `【附件路径】` / `【用户消息】`，更新为标签断言
- [ ] **Step 2:** 跑相关测试 + `npx tsc --noEmit -p tsconfig.node.json`
- [ ] **Step 3:** Commit：`test(agent): 对齐 shy-context 注入断言`

## Task 3: 手工验收备忘

- [ ] **Step 1:** 重启 `npm run dev`，带图发送：气泡为原文+图，无标签、无旧中文块
- [ ] **Step 2:** （可选）确认 agent 侧日志/断点中用户轮含 `<shy-context>`
