import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  app: { getPath: () => process.env.SHY_HOME ?? tmpdir() }
}))

let tmpDir = ''

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'shy-session-store-'))
  process.env.SHY_HOME = tmpDir
  vi.resetModules()
})

afterEach(() => {
  delete process.env.SHY_HOME
  rmSync(tmpDir, { recursive: true, force: true })
})

describe('sessions runStatus', () => {
  it('按复合游标稳定分页，并在同毫秒消息间不重不漏', async () => {
    const store = await import('./store')
    const s = store.createSession()
    const { getDb } = await import('../memory/db')
    const rows = ['a', 'b', 'c', 'd'].map((id) => ({ id, content: id }))
    for (const row of rows) {
      getDb()
        .prepare(
          `INSERT INTO session_messages (id, session_id, role, content, created_at, kind)
           VALUES (?, ?, 'user', ?, '2026-01-01T00:00:00.000Z', NULL)`
        )
        .run(row.id, s.id, row.content)
    }
    const first = store.getSessionMessagesPage({ sessionId: s.id, limit: 2 })
    expect(first.messages.map((m) => m.id)).toEqual(['c', 'd'])
    expect(first.hasMore).toBe(true)
    const second = store.getSessionMessagesPage({
      sessionId: s.id,
      limit: 2,
      cursor: first.nextCursor ?? undefined
    })
    expect(second.messages.map((m) => m.id)).toEqual(['a', 'b'])
    expect(second.hasMore).toBe(false)
  })

  it('空会话返回空页', async () => {
    const store = await import('./store')
    const s = store.createSession()
    expect(store.getSessionMessagesPage({ sessionId: s.id })).toMatchObject({
      messages: [],
      hasMore: false,
      nextCursor: null
    })
  })

  it('新会话默认为 idle，paused 为 false', async () => {
    const store = await import('./store')
    const s = store.createSession('goal', 't')
    const d = store.getSession(s.id)
    expect(d?.runStatus).toBe('idle')
    expect(d?.paused).toBe(false)
  })

  it('从旧表迁移 paused 状态并保留 checkpoint 行为', async () => {
    const { getDb } = await import('../memory/db')
    const store = await import('./store')
    const db = getDb()
    db.exec(`
      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        mode TEXT NOT NULL,
        goal TEXT,
        checklist TEXT NOT NULL DEFAULT '[]',
        short_memory TEXT NOT NULL DEFAULT '',
        paused INTEGER NOT NULL DEFAULT 0,
        checkpoint TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      INSERT INTO sessions (id, title, mode, goal, checklist, short_memory, paused, created_at, updated_at)
      VALUES ('old-p', 'old', 'goal', 'g', '[]', '', 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
      INSERT INTO sessions (id, title, mode, goal, checklist, short_memory, paused, checkpoint, created_at, updated_at)
      VALUES ('old-c', 'old', 'goal', 'g', '[]', '', 0, '{"round":1}', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    `)
    store.ensureSessionTables()
    expect(store.getSession('old-p')).toMatchObject({ runStatus: 'paused', paused: true })
    expect(store.getSession('old-c')).toMatchObject({ runStatus: 'idle', paused: false })
    expect(
      db.prepare(`SELECT checkpoint FROM sessions WHERE id = 'old-c'`).get()
    ).toMatchObject({ checkpoint: '{"round":1}' })
  })

  it('已存在 run_status 时不重复回填 paused 旧字段', async () => {
    const { getDb } = await import('../memory/db')
    const store = await import('./store')
    store.ensureSessionTables()
    const db = getDb()
    db.exec(`
      INSERT INTO sessions (
        id, title, mode, goal, checklist, short_memory, paused, run_status, created_at, updated_at
      )
      VALUES (
        'idle-paused', 'idle', 'goal', 'g', '[]', '', 1, 'idle',
        '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'
      )
    `)

    store.ensureSessionTables()

    const row = db.prepare(`SELECT run_status FROM sessions WHERE id = 'idle-paused'`).get() as {
      run_status: string
    }
    expect(row.run_status).toBe('idle')
  })

  it('更新并读取 runtime 验收字段', async () => {
    const store = await import('./store')
    const s = store.createSession('goal', 'runtime')

    store.updateSessionRuntime(s.id, {
      verifyCommand: 'npm test',
      runStatus: 'running',
      approvedChecks: ['npm test']
    })

    expect(store.getSession(s.id)).toMatchObject({
      verifyCommand: 'npm test',
      runStatus: 'running',
      paused: false,
      approvedChecks: ['npm test']
    })
  })

  it('写入并读取完整结果字段', async () => {
    const store = await import('./store')
    const s = store.createSession('goal', 'result')
    store.updateSessionRuntime(s.id, {
      resultContent: '完整结果正文',
      resultReportPath: '/tmp/report.md'
    })
    const d = store.getSession(s.id)
    expect(d?.resultContent).toBe('完整结果正文')
    expect(d?.resultReportPath).toBe('/tmp/report.md')

    store.appendMessage(s.id, 'assistant', '完整结果正文', 'result')
    expect(store.getSession(s.id)?.messages.at(-1)?.kind).toBe('result')
  })

  it('runStatus 与旧 paused 字段双向同步', async () => {
    const store = await import('./store')
    const s = store.createSession('goal', 'pause')

    store.updateSessionRuntime(s.id, { runStatus: 'paused' })
    expect(store.getSession(s.id)).toMatchObject({ runStatus: 'paused', paused: true })

    store.updateSessionRuntime(s.id, { paused: false })
    expect(store.getSession(s.id)).toMatchObject({ runStatus: 'running', paused: false })

    store.updateSessionRuntime(s.id, { paused: true })
    expect(store.getSession(s.id)).toMatchObject({ runStatus: 'paused', paused: true })
  })

  it('rowToSummary 包含 projectId', async () => {
    const { getDb } = await import('../memory/db')
    const store = await import('./store')
    store.ensureSessionTables()
    const s = store.createSession('interactive', 'proj')
    getDb().prepare(`UPDATE sessions SET project_id = ? WHERE id = ?`).run('proj-1', s.id)
    expect(store.getSession(s.id)?.projectId).toBe('proj-1')
    expect(store.listSessions().find((x) => x.id === s.id)?.projectId).toBe('proj-1')
  })

  it('新会话 model 为空', async () => {
    const store = await import('./store')
    const s = store.createSession()
    expect(store.getSession(s.id)?.model).toBeNull()
    expect(store.getSessionSummary(s.id)?.model).toBeNull()
    expect(store.listSessions().find((x) => x.id === s.id)?.model).toBeNull()
  })

  it('setSessionModel 后 get/list 可见，null 可清空', async () => {
    const store = await import('./store')
    const s = store.createSession('interactive', 'model-test')
    store.setSessionModel(s.id, 'claude-sonnet-4')
    expect(store.getSession(s.id)?.model).toBe('claude-sonnet-4')
    expect(store.getSessionSummary(s.id)?.model).toBe('claude-sonnet-4')
    expect(store.listSessions().find((x) => x.id === s.id)?.model).toBe('claude-sonnet-4')

    store.setSessionModel(s.id, null)
    expect(store.getSession(s.id)?.model).toBeNull()
    expect(store.listSessions().find((x) => x.id === s.id)?.model).toBeNull()
  })

  it('ensureSessionTables 为旧表 ALTER model 列', async () => {
    const { getDb } = await import('../memory/db')
    const store = await import('./store')
    const db = getDb()
    db.exec(`
      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        mode TEXT NOT NULL,
        goal TEXT,
        checklist TEXT NOT NULL DEFAULT '[]',
        short_memory TEXT NOT NULL DEFAULT '',
        paused INTEGER NOT NULL DEFAULT 0,
        checkpoint TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      INSERT INTO sessions (id, title, mode, goal, checklist, short_memory, paused, created_at, updated_at)
      VALUES ('legacy-m', 'legacy', 'interactive', NULL, '[]', '', 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    `)
    store.ensureSessionTables()
    expect(store.getSession('legacy-m')?.model).toBeNull()
    store.setSessionModel('legacy-m', 'gpt-4o-mini')
    expect(store.getSession('legacy-m')?.model).toBe('gpt-4o-mini')
  })

  it('tool upsert：call 插入 running，result 更新同一行', async () => {
    const store = await import('./store')
    const s = store.createSession()
    const inserted = store.upsertSessionToolMessage(s.id, {
      toolId: 'tc-1',
      toolName: 'web_fetch',
      toolStatus: 'running',
      toolInput: { url: 'https://a.example' }
    })
    expect(inserted.role).toBe('tool')
    expect(inserted.meta).toMatchObject({
      toolId: 'tc-1',
      toolName: 'web_fetch',
      toolStatus: 'running'
    })
    const updated = store.upsertSessionToolMessage(s.id, {
      toolId: 'tc-1',
      toolName: 'web_fetch',
      toolStatus: 'done',
      toolResult: { ok: true }
    })
    expect(updated.id).toBe(inserted.id)
    expect(updated.meta?.toolStatus).toBe('done')
    expect(updated.meta?.toolResult).toEqual({ ok: true })
    const page = store.getSessionMessagesPage({ sessionId: s.id, limit: 10 })
    expect(page.messages.filter((m) => m.role === 'tool')).toHaveLength(1)
    expect(page.messages[0]?.meta?.toolId).toBe('tc-1')
  })

  it('appendProcessMessage 写入 reasoning，旧行无 meta 仍可读', async () => {
    const store = await import('./store')
    const { getDb } = await import('../memory/db')
    const s = store.createSession()
    store.appendProcessMessage(s.id, 'reasoning', '思考中…', { durationMs: 1200 })
    getDb()
      .prepare(
        `INSERT INTO session_messages (id, session_id, role, content, created_at, kind, meta)
         VALUES ('legacy-msg', ?, 'user', '旧消息', '2026-01-01T00:00:00.000Z', NULL, NULL)`
      )
      .run(s.id)
    const all = store.getSession(s.id)?.messages ?? []
    const legacy = all.find((m) => m.id === 'legacy-msg')
    expect(legacy?.content).toBe('旧消息')
    expect(legacy?.meta).toBeUndefined()
    expect(all.some((m) => m.role === 'reasoning' && m.meta?.durationMs === 1200)).toBe(true)
  })

  it('markRunningToolsInterrupted 把 running tool 标为 failed', async () => {
    const store = await import('./store')
    const s = store.createSession()
    store.upsertSessionToolMessage(s.id, {
      toolId: 't-run',
      toolName: 'shell_exec',
      toolStatus: 'running',
      toolInput: { command: 'sleep 9' }
    })
    store.upsertSessionToolMessage(s.id, {
      toolId: 't-done',
      toolName: 'web_fetch',
      toolStatus: 'done',
      toolResult: 'ok'
    })
    const n = store.markRunningToolsInterrupted(s.id)
    expect(n).toBe(1)
    const tools = (store.getSession(s.id)?.messages ?? []).filter((m) => m.role === 'tool')
    expect(tools.find((m) => m.meta?.toolId === 't-run')?.meta?.toolStatus).toBe('failed')
    expect(tools.find((m) => m.meta?.toolId === 't-done')?.meta?.toolStatus).toBe('done')
  })

  it('listSessionsForUi 隐藏无 user 消息的 interactive，保留 goal 与已发起对话', async () => {
    const store = await import('./store')
    const { getDb } = await import('../memory/db')
    const emptyInteractive = store.createSession('interactive', '空草稿')
    const started = store.createSession('interactive', '已聊')
    const goalIdle = store.createSession('goal', '定时')
    getDb()
      .prepare(
        `INSERT INTO session_messages (id, session_id, role, content, created_at, kind)
         VALUES (?, ?, 'user', 'hi', '2026-01-01T00:00:00.000Z', NULL)`
      )
      .run('m1', started.id)
    const ui = store.listSessionsForUi().map((s) => s.id)
    expect(ui).toContain(started.id)
    expect(ui).toContain(goalIdle.id)
    expect(ui).not.toContain(emptyInteractive.id)
    expect(store.listSessions().map((s) => s.id)).toContain(emptyInteractive.id)
  })

  it('按 runStatus 仅列出 goal 会话', async () => {
    const store = await import('./store')
    const running = store.createSession('goal', 'running')
    const paused = store.createSession('goal', 'paused')
    const completed = store.createSession('goal', 'completed')
    const cancelled = store.createSession('goal', 'cancelled')
    const idle = store.createSession('goal', 'idle')
    const interactive = store.createSession('interactive', 'interactive')
    store.updateSessionRuntime(running.id, { runStatus: 'running' })
    store.updateSessionRuntime(paused.id, { runStatus: 'paused' })
    store.updateSessionRuntime(completed.id, { runStatus: 'completed' })
    store.updateSessionRuntime(cancelled.id, { runStatus: 'cancelled' })
    store.updateSessionRuntime(interactive.id, { runStatus: 'running' })

    expect(store.listGoalSessionsByRunStatus('running').map((s) => s.id)).toEqual([running.id])
    expect(store.listGoalSessionsByRunStatus('paused').map((s) => s.id)).toEqual([paused.id])
    expect(store.listGoalSessionsByRunStatus('running').map((s) => s.id)).not.toContain(idle.id)
  })
})
