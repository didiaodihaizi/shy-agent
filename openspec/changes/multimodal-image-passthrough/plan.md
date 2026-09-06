# multimodal-image-passthrough Implementation Plan

> **For agentic workers:** `/opsx:apply` 或按任务推进。

**Goal:** 取消发图预 OCR；会话模型支持 vision 时当轮透传 `image_url`，否则仅路径。

**Architecture:** prepare 只组装文本 context + 可选 imageParts；runAgent 带入 turn-runner；调用 LLM 前把本轮 user content 扩成 parts（data URL）。落库仍 displayMessage。

**Tech Stack:** TypeScript、OpenAI SDK、vitest。

**工作目录:** `.worktrees/composer-plus-attachments`

---

## Task 1: prepare 去预读

**Files:** `prepare.ts`, `vision-model.ts`, `build-context.ts`, tests

- [ ] **Step 1:** 写失败测试：有图 + vision 模型 → 返回 imageParts、message 无 OCR 长文；有图 + 非 vision → 无 imageParts、message 含路径
- [ ] **Step 2:** 实现 prepare 分支，删除 `readImages` 调用
- [ ] **Step 3:** 跑 attachments 单测通过并 commit

## Task 2: LLM + turn-runner

**Files:** `llm-client.ts`, `turn-runner/*`, `service.ts`, `ipc.ts`, tests

- [ ] **Step 1:** 扩展 LLMMessage content 类型；测试 stream 接受 parts
- [ ] **Step 2:** 贯通 imageParts → 当轮 user multimodal content（data URL + 上限）
- [ ] **Step 3:** 跑相关测试 + tsc；commit

## Task 3: 手工验收

- [ ] 重启 dev，多模态模型发图验证
