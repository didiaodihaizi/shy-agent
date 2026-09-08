# Retrospective: persist-session-timeline

> Written: 2026-09-09 (after verify PASS WITH WARNINGS)  
> Commit range: `1aabfe4..36cb19f`  
> Worktree: `.worktrees/persist-session-timeline`

---

## 0. Evidence

- **Commit range**: `1aabfe4..36cb19f` (3 commits)
- **Diff size**: +1680 / -99 across 37 files
- **Tasks done**: 10/11（余 4.2 手动重启 dogfood）
- **Active hours**: ~半日（含 brainstorm + OpenCode/session-cache cherry + 落盘实现）
- **Subagent dispatches**: n/a（父会话直接实现，未逐 task 派 implementer）
- **New external dependencies**: none
- **Bugs encountered post-merge**: none（尚未 merge）
- **OpenSpec validate state at archive**: 本 change valid；全仓 `--all` 另有 3 个无关历史 change fail
- **Test coverage signal**: verify 当场 `src/main/sessions` + `src/renderer` → 43 files / 256 tests passed；关键 `store` / `timeline-persist` / `historyMessageToUiMsg`

Commit chain:

```
7b64031 docs(openspec): 提出 persist-session-timeline 变更
c2b07c8 fix: OpenCode 补 session 头，切会话隔离并缓存时间轴
36cb19f feat(sessions): 过程态时间轴落盘 SQLite 并支持重启还原
```

---

## 1. Wins

- SQLite 单表 + `meta` 比 timeline.json 更贴会话生命周期；upsert-by-toolId 与 UI 合并语义对齐
- `timeline-persist` helper 同时挂 interactive + goal，避免双路径漂移
- 进程内 `sessionChatCache` 保留切会话体验，DB 作跨重启真相，职责清晰
- 单测覆盖 insert→update、running→interrupted、历史→UI 映射

## 2. Misses

- 🟡 [painful | evidence: tasks 4.2 / verify §7] 无 Electron 重启 E2E；端到端仍依赖手动 dogfood
- 📌 [nit | evidence: §0 subagent n/a] apply 未走 subagent-driven-development 逐任务派工
- 📌 [nit | evidence: c2b07c8] 同一分支 cherry 了 OpenCode session 头修复，diff 面大于「纯落盘」

## 3. Plan deviations

| Plan task | What changed | Why |
|-----------|--------------|-----|
| 纯落盘 change | 分支含 OpenCode headers + sessionChatCache | 会话空时间轴/切会话泄漏与落盘同会话痛点，一并修 |
| tasks 4.2 | 未勾选即进 archive | verify 记为非阻塞；用户选「retro→sync→archive」继续 |

## 4. Skill / workflow compliance

| Skill | Used |
|-------|------|
| superpowers:brainstorming | ✓ |
| superpowers:writing-plans | ✓（plan.md） |
| superpowers:using-git-worktrees | ✓ |
| superpowers:subagent-driven-development | ✗ 见下 |
| (transitive) TDD | ✓（store / persist / UI 映射先测或同提交测） |
| (transitive) requesting-code-review | ✗ 见下 |
| superpowers:finishing-a-development-branch | 待 archive 后用户合入 |

### Deliberately Skipped Skills

- **superpowers:subagent-driven-development**
  - **What was skipped**: 未按 plan 每 micro-task 派独立 implementer
  - **Why this cycle**: 实现集中在 `store` + `timeline-persist` + 少量 UI 映射，父会话连续 TDD 已完成；再拆 subagent 通信成本高于收益（观察：单 commit `36cb19f` 覆盖 tasks 1–4.1）
  - **How to prevent recurrence**: `scope-judgment rule` — 单模块 <~3 文件热点且无跨进程契约分叉时，可父会话直做，但仍须在 plan 标注「本 change 不派 subagent」

- **superpowers:requesting-code-review（每任务后）**
  - **What was skipped**: 未单独 dispatch code-reviewer
  - **Why this cycle**: 与上同；verify 已对 design/specs/tasks 做一致性抽查
  - **How to prevent recurrence**: finishing 前至少一次 scoped reviewer，或 plan 写明「合并终审」

## 5. Surprises

- 用户本机 `~/.shy` 在落盘落地前仍跑主仓 `dev`，DB 尚无 `meta`——验证「重启还原」必须用 feature worktree 构建，否则会误判未实现
- OpenCode 缺 `x-opencode-session` 与切会话空轴问题叠在同一使用路径，容易被当成「落盘坏了」

## 6. Promote candidates → long-term learning

- [ ] 🟡 **Feature worktree 的运行时验证必须用该 worktree 的构建，勿用主仓 `dev` 进程对照未合并 schema** → **Promote to** project AGENTS.md（Worktree 约定段）
  > **Why**: 本 cycle 用户 DB 无 meta，因实际跑的是主仓，差点误判落盘未生效
  > **How to apply**: verify/dogfood 清单写明「从哪个 worktree `npm run dev`」

- [ ] 📌 **过程态落盘与会话隔离/缓存可同 PR，但 openspec change 名应反映主价值或拆 cherry** → **One-off**
  > **Why**: 本分支 diff 含 OpenCode + cache，review 认知负担略增
  > **How to apply**: 下次若顺手修相邻 bug，proposal Impact 写明 cherry 范围
