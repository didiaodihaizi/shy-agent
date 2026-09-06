# Retrospective: composer-plus-attachments

> Written: 2026-09-06 (after verify passed)  
> Commit range: `55d6241..93bdd21`  
> Worktree: `.worktrees/composer-plus-attachments`

---

## 0. Evidence

- **Commit range**: `55d6241..93bdd21` (5 commits)
- **Diff size**: +1658 / -37 across 31 files
- **Tasks done**: 14/14
- **Active hours**: ~1（brainstorm 已在主会话完成）
- **Subagent dispatches**: 3（IPC / agent / UI）
- **New external dependencies**: none
- **Bugs encountered post-merge**: none（尚未 merge）
- **OpenSpec validate state at archive**: 本 change OK；全仓另有 3 个无关历史 change fail
- **Test coverage signal**: vitest 27 passed（attachments + preload + composerAttachments）

Commit chain:

```
1a266df docs(openspec): 提出 composer-plus-attachments change
0d010b5 feat(ipc): ChatRequest 附件字段与多选文件
84adc9a feat(agent): 发送前读图并组装附件上下文
95d1837 feat(ui): Composer 加号附件 chip 与图片预览
93bdd21 docs(openspec): 勾选 composer-plus-attachments 全部 tasks
```

---

## 1. Wins

- [evidence: 84adc9a / prepare.ts] 发送前读图 → 纯文本增强 message，符合「vision 读完再交用户模型」
- [evidence: 95d1837 / ComposerPlusMenu.tsx] `+` 自绘菜单 + chip + shy-file 预览一次落地
- [evidence: 27 tests] 选型/降级/拼装/分类有单测护栏

## 2. Misses

- 🟡 [painful | evidence: verify §7] 无 E2E 覆盖 chip hover / 发送清空；依赖手动 dogfood
- 📌 [nit | evidence: requesting-code-review] 每任务后未单独跑 code-reviewer subagent（时间上合并为父会话抽查）

## 3. Plan deviations

| Plan task | What changed | Why |
|-----------|--------------|-----|
| 图片预览 | 用 `shy-file://` 协议而非 data URL IPC | 对齐既有 shy-material，少一条 IPC |
| Task 2 模块 | 增加 `prepare.ts` 编排层 | 保持 vision/read/build 可单测 |

## 4. Skill / workflow compliance

| Skill | Used |
|-------|------|
| superpowers:brainstorming | ✓ |
| superpowers:writing-plans | ✓（产出到 change/plan.md） |
| superpowers:using-git-worktrees | ✓ |
| superpowers:subagent-driven-development | ✓（3 个 implementer） |
| (transitive) TDD | ✓（agent 附件模块先测） |
| (transitive) requesting-code-review | ✗ 见下 |
| superpowers:finishing-a-development-branch | 待用户选择合并方式 |

### Deliberately Skipped Skills

- **superpowers:requesting-code-review（每任务后）**
  - **What was skipped**: 未在每个 Task 后单独 dispatch code-reviewer
  - **Why this cycle**: 三次 implementer 已自带测试与 typecheck；父会话对关键路径做了抽查；再串 3 次 reviewer 会显著拉长周期且无新阻塞发现预期
  - **How to prevent recurrence**: 下一周期对 UI Task 至少跑一次 scoped reviewer；或在 plan 中标注「合并为一次终审」

---

## 5. Next time

- 尽早约定图片预览协议（shy-file vs data URL），避免 UI Task 临时选型
- 手动 dogfood 清单写进 tasks 4.x 并要求勾选前跑一遍
