import { randomUUID } from 'crypto'
import type {
  AgentMode,
  ChatMessage,
  ChatMessageMeta,
  GoalChecklistItem,
  RunStatus,
  SessionDetail,
  SessionMessagesPage,
  SessionMessagesPageInput,
  SessionSummary
} from '../../shared/ipc'
import { getDb } from '../memory/db'

/** 单条 meta 序列化上限，避免工具巨输出撑爆库 */
const META_JSON_MAX_CHARS = 48_000

function now(): string {
  return new Date().toISOString()
}

function touchSession(sessionId: string, at = now()): void {
  getDb().prepare(`UPDATE sessions SET updated_at = ? WHERE id = ?`).run(at, sessionId)
}

function serializeMeta(meta: ChatMessageMeta | undefined): string | null {
  if (!meta) return null
  let raw = JSON.stringify(meta)
  if (raw.length <= META_JSON_MAX_CHARS) return raw
  const slim: ChatMessageMeta = {
    ...meta,
    toolInput:
      meta.toolInput === undefined
        ? undefined
        : { _truncated: true, preview: String(JSON.stringify(meta.toolInput)).slice(0, 2000) },
    toolResult:
      meta.toolResult === undefined
        ? undefined
        : { _truncated: true, preview: String(JSON.stringify(meta.toolResult)).slice(0, 4000) }
  }
  raw = JSON.stringify(slim)
  if (raw.length <= META_JSON_MAX_CHARS) return raw
  return JSON.stringify({
    toolId: meta.toolId,
    toolName: meta.toolName,
    toolStatus: meta.toolStatus,
    toolError: meta.toolError,
    durationMs: meta.durationMs,
    _truncated: true
  })
}

function parseMeta(raw: unknown): ChatMessageMeta | undefined {
  if (raw == null || raw === '') return undefined
  try {
    const v = JSON.parse(String(raw)) as ChatMessageMeta
    return v && typeof v === 'object' ? v : undefined
  } catch {
    return undefined
  }
}

function rowToMessage(m: Record<string, unknown>): ChatMessage {
  const kind = m.kind === 'result' ? ('result' as const) : undefined
  const meta = parseMeta(m.meta)
  return {
    id: String(m.id),
    role: m.role as ChatMessage['role'],
    content: String(m.content),
    createdAt: String(m.created_at),
    ...(kind ? { kind } : {}),
    ...(meta ? { meta } : {})
  }
}

export function ensureSessionTables(): void {
  const db = getDb()
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
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
    CREATE TABLE IF NOT EXISTS session_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    );
  `)
  const columns = db.prepare(`PRAGMA table_info(sessions)`).all() as { name: string }[]
  const columnNames = new Set(columns.map((column) => column.name))
  if (!columnNames.has('run_status')) {
    db.exec(`ALTER TABLE sessions ADD COLUMN run_status TEXT NOT NULL DEFAULT 'idle'`)
    db.exec(`
      UPDATE sessions
      SET run_status = 'paused'
      WHERE paused = 1 AND (run_status = 'idle' OR run_status IS NULL OR run_status = '')
    `)
  }
  if (!columnNames.has('verify_command')) {
    db.exec(`ALTER TABLE sessions ADD COLUMN verify_command TEXT`)
  }
  if (!columnNames.has('approved_checks')) {
    db.exec(`ALTER TABLE sessions ADD COLUMN approved_checks TEXT NOT NULL DEFAULT '[]'`)
  }
  if (!columnNames.has('result_content')) {
    db.exec(`ALTER TABLE sessions ADD COLUMN result_content TEXT`)
  }
  if (!columnNames.has('result_report_path')) {
    db.exec(`ALTER TABLE sessions ADD COLUMN result_report_path TEXT`)
  }
  if (!columnNames.has('project_id')) {
    db.exec(`ALTER TABLE sessions ADD COLUMN project_id TEXT`)
  }
  if (!columnNames.has('model')) {
    db.exec(`ALTER TABLE sessions ADD COLUMN model TEXT`)
  }
  const msgCols = db.prepare(`PRAGMA table_info(session_messages)`).all() as { name: string }[]
  if (!msgCols.some((c) => c.name === 'kind')) {
    db.exec(`ALTER TABLE session_messages ADD COLUMN kind TEXT`)
  }
  if (!msgCols.some((c) => c.name === 'meta')) {
    db.exec(`ALTER TABLE session_messages ADD COLUMN meta TEXT`)
  }
}

export function createSession(
  mode: AgentMode = 'interactive',
  title?: string,
  id?: string
): SessionSummary {
  ensureSessionTables()
  const sessionId = id || randomUUID()
  const t = now()
  const finalTitle = title?.trim() || '新对话'
  getDb()
    .prepare(
      `INSERT INTO sessions (id, title, mode, goal, checklist, short_memory, paused, created_at, updated_at)
       VALUES (?, ?, ?, NULL, '[]', '', 0, ?, ?)`
    )
    .run(sessionId, finalTitle, mode, t, t)
  return {
    id: sessionId,
    title: finalTitle,
    mode,
    createdAt: t,
    updatedAt: t,
    paused: false,
    runStatus: 'idle'
  }
}

export function listSessions(): SessionSummary[] {
  ensureSessionTables()
  const rows = getDb()
    .prepare(`SELECT * FROM sessions ORDER BY updated_at DESC`)
    .all() as Record<string, unknown>[]
  return rows.map(rowToSummary)
}

/**
 * 侧栏可见会话：已真正发起过对话（有 user 消息）的会话，
 * 以及 goal 模式会话（定时任务等可能尚未落消息也需可见）。
 * interactive 空草稿不出现在列表中。
 */
export function listSessionsForUi(): SessionSummary[] {
  ensureSessionTables()
  const rows = getDb()
    .prepare(
      `SELECT s.* FROM sessions s
       WHERE s.mode = 'goal'
          OR EXISTS (
            SELECT 1 FROM session_messages m
            WHERE m.session_id = s.id AND m.role = 'user'
          )
       ORDER BY s.updated_at DESC`
    )
    .all() as Record<string, unknown>[]
  return rows.map(rowToSummary)
}

export function listGoalSessionsByRunStatus(status: RunStatus): SessionSummary[] {
  ensureSessionTables()
  const rows = getDb()
    .prepare(`SELECT * FROM sessions WHERE mode='goal' AND run_status=? ORDER BY updated_at DESC`)
    .all(status) as Record<string, unknown>[]
  return rows.map(rowToSummary)
}

export function getSession(id: string): SessionDetail | null {
  ensureSessionTables()
  const row = getDb().prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | undefined
  if (!row) return null
  const messages = getDb()
    .prepare(`SELECT * FROM session_messages WHERE session_id = ? ORDER BY created_at ASC`)
    .all(id) as Record<string, unknown>[]
  const summary = rowToSummary(row)
  return {
    ...summary,
    messages: messages.map(rowToMessage),
    checklist: JSON.parse(String(row.checklist || '[]')) as GoalChecklistItem[],
    shortMemory: String(row.short_memory || ''),
    approvedChecks: JSON.parse(String(row.approved_checks || '[]')) as string[],
    resultContent: row.result_content ? String(row.result_content) : undefined,
    resultReportPath: row.result_report_path ? String(row.result_report_path) : undefined
  }
}

export function getSessionSummary(id: string): SessionSummary | null {
  ensureSessionTables()
  const row = getDb().prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | undefined
  return row ? rowToSummary(row) : null
}

const DEFAULT_MESSAGE_PAGE_SIZE = 50

export function getSessionMessagesPage(input: SessionMessagesPageInput): SessionMessagesPage {
  ensureSessionTables()
  const limit = Math.max(1, Math.min(200, Math.floor(input.limit ?? DEFAULT_MESSAGE_PAGE_SIZE)))
  const cursor = input.cursor
  const rows = (cursor
    ? getDb()
        .prepare(
          `SELECT * FROM session_messages
           WHERE session_id = ? AND (created_at < ? OR (created_at = ? AND id < ?))
           ORDER BY created_at DESC, id DESC LIMIT ?`
        )
        .all(input.sessionId, cursor.beforeCreatedAt, cursor.beforeCreatedAt, cursor.beforeId, limit + 1)
    : getDb()
        .prepare(
          `SELECT * FROM session_messages
           WHERE session_id = ? ORDER BY created_at DESC, id DESC LIMIT ?`
        )
        .all(input.sessionId, limit + 1)) as Record<string, unknown>[]
  const hasMore = rows.length > limit
  const pageRows = rows.slice(0, limit).reverse()
  const messages = pageRows.map(rowToMessage)
  const oldest = messages[0]
  return {
    messages,
    hasMore,
    nextCursor: hasMore && oldest ? { beforeCreatedAt: oldest.createdAt, beforeId: oldest.id } : null
  }
}

export function deleteSession(id: string): void {
  ensureSessionTables()
  getDb().prepare(`DELETE FROM session_messages WHERE session_id = ?`).run(id)
  getDb().prepare(`DELETE FROM sessions WHERE id = ?`).run(id)
}

export function appendMessage(
  sessionId: string,
  role: ChatMessage['role'],
  content: string,
  kind?: ChatMessage['kind'],
  meta?: ChatMessageMeta
): ChatMessage {
  ensureSessionTables()
  const createdAt = now()
  const msg: ChatMessage = {
    id: randomUUID(),
    role,
    content,
    createdAt,
    ...(kind ? { kind } : {}),
    ...(meta ? { meta } : {})
  }
  getDb()
    .prepare(
      `INSERT INTO session_messages (id, session_id, role, content, created_at, kind, meta) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(msg.id, sessionId, role, content, createdAt, kind ?? null, serializeMeta(meta))
  touchSession(sessionId, createdAt)
  // 占位标题：首条用户消息的本地摘要；正式总结标题由 summarizeSessionTitle 刷新
  if (role === 'user') {
    const s = getDb().prepare(`SELECT title FROM sessions WHERE id = ?`).get(sessionId) as
      | { title?: string }
      | undefined
    if (s?.title === '新对话') {
      getDb()
        .prepare(`UPDATE sessions SET title = ? WHERE id = ?`)
        .run(placeholderTitle(content), sessionId)
    }
  }
  return msg
}

export function appendProcessMessage(
  sessionId: string,
  role: 'reasoning' | 'assistant' | 'system',
  content: string,
  meta?: ChatMessageMeta,
  kind?: ChatMessage['kind']
): ChatMessage {
  return appendMessage(sessionId, role, content, kind, meta)
}

export type UpsertToolMessageInput = {
  toolId: string
  toolName?: string
  toolStatus: 'running' | 'done' | 'failed'
  toolInput?: unknown
  toolResult?: unknown
  toolError?: string
}

function findToolMessageRow(
  sessionId: string,
  toolId: string
): { id: string; meta: ChatMessageMeta | undefined; content: string; createdAt: string } | null {
  const rows = getDb()
    .prepare(
      `SELECT id, content, created_at, meta FROM session_messages WHERE session_id = ? AND role = 'tool'`
    )
    .all(sessionId) as Record<string, unknown>[]
  for (const row of rows) {
    const meta = parseMeta(row.meta)
    if (meta?.toolId === toolId) {
      return {
        id: String(row.id),
        meta,
        content: String(row.content),
        createdAt: String(row.created_at)
      }
    }
  }
  return null
}

export function upsertSessionToolMessage(
  sessionId: string,
  input: UpsertToolMessageInput
): ChatMessage {
  ensureSessionTables()
  const existing = findToolMessageRow(sessionId, input.toolId)
  const nextMeta: ChatMessageMeta = {
    ...(existing?.meta ?? {}),
    toolId: input.toolId,
    toolName: input.toolName ?? existing?.meta?.toolName ?? 'tool',
    toolStatus: input.toolStatus,
    ...(input.toolInput !== undefined ? { toolInput: input.toolInput } : {}),
    ...(input.toolResult !== undefined ? { toolResult: input.toolResult } : {}),
    ...(input.toolError !== undefined ? { toolError: input.toolError } : {})
  }
  const label = nextMeta.toolName ?? 'tool'
  if (existing) {
    getDb()
      .prepare(`UPDATE session_messages SET content = ?, meta = ? WHERE id = ?`)
      .run(label, serializeMeta(nextMeta), existing.id)
    touchSession(sessionId)
    return {
      id: existing.id,
      role: 'tool',
      content: label,
      createdAt: existing.createdAt,
      meta: nextMeta
    }
  }
  return appendMessage(sessionId, 'tool', label, undefined, nextMeta)
}

/** 回合结束时把仍为 running 的 tool 标为 failed（中断） */
export function markRunningToolsInterrupted(sessionId: string): number {
  ensureSessionTables()
  const rows = getDb()
    .prepare(
      `SELECT id, meta FROM session_messages WHERE session_id = ? AND role = 'tool'`
    )
    .all(sessionId) as Record<string, unknown>[]
  let n = 0
  for (const row of rows) {
    const meta = parseMeta(row.meta)
    if (meta?.toolStatus !== 'running') continue
    const next: ChatMessageMeta = {
      ...meta,
      toolStatus: 'failed',
      toolError: meta.toolError ?? 'interrupted'
    }
    getDb()
      .prepare(`UPDATE session_messages SET meta = ? WHERE id = ?`)
      .run(serializeMeta(next), String(row.id))
    n += 1
  }
  if (n > 0) touchSession(sessionId)
  return n
}

function placeholderTitle(userText: string): string {
  const t = userText
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t) return '新对话'
  const sentence = t.split(/[。！？!?\n]/)[0]?.trim() || t
  const clipped = sentence.slice(0, 28)
  return clipped.length < sentence.length ? `${clipped}…` : clipped
}

export function setSessionTitle(sessionId: string, title: string): void {
  ensureSessionTables()
  const t = title.trim().slice(0, 40)
  if (!t) return
  getDb()
    .prepare(`UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?`)
    .run(t, now(), sessionId)
}

export function setSessionModel(sessionId: string, model: string | null): void {
  ensureSessionTables()
  getDb()
    .prepare(`UPDATE sessions SET model = ?, updated_at = ? WHERE id = ?`)
    .run(model, now(), sessionId)
}

export function updateSessionRuntime(
  sessionId: string,
  patch: {
    mode?: AgentMode
    goal?: string | null
    checklist?: GoalChecklistItem[]
    shortMemory?: string
    paused?: boolean
    checkpoint?: string | null
    verifyCommand?: string | null
    runStatus?: RunStatus
    approvedChecks?: string[]
    resultContent?: string | null
    resultReportPath?: string | null
  }
): void {
  ensureSessionTables()
  const cur = getDb().prepare(`SELECT * FROM sessions WHERE id = ?`).get(sessionId) as
    | Record<string, unknown>
    | undefined
  if (!cur) return
  const currentRunStatus = (cur.run_status || 'idle') as RunStatus
  let runStatus = patch.runStatus ?? currentRunStatus
  if (patch.runStatus === undefined && patch.paused === true) {
    runStatus = 'paused'
  } else if (
    patch.runStatus === undefined &&
    patch.paused === false &&
    currentRunStatus === 'paused'
  ) {
    runStatus = 'running'
  }
  getDb()
    .prepare(
      `UPDATE sessions
       SET mode=?, goal=?, checklist=?, short_memory=?, paused=?, checkpoint=?,
           verify_command=?, run_status=?, approved_checks=?, result_content=?,
           result_report_path=?, updated_at=?
       WHERE id=?`
    )
    .run(
      patch.mode ?? cur.mode,
      patch.goal === undefined ? cur.goal : patch.goal,
      JSON.stringify(patch.checklist ?? JSON.parse(String(cur.checklist || '[]'))),
      patch.shortMemory ?? cur.short_memory,
      runStatus === 'paused' ? 1 : 0,
      patch.checkpoint === undefined ? cur.checkpoint : patch.checkpoint,
      patch.verifyCommand === undefined ? cur.verify_command : patch.verifyCommand,
      runStatus,
      JSON.stringify(
        patch.approvedChecks ?? JSON.parse(String(cur.approved_checks || '[]'))
      ),
      patch.resultContent === undefined ? cur.result_content : patch.resultContent,
      patch.resultReportPath === undefined ? cur.result_report_path : patch.resultReportPath,
      now(),
      sessionId
    )
}

export function getCheckpoint(sessionId: string): string | null {
  ensureSessionTables()
  const row = getDb().prepare(`SELECT checkpoint FROM sessions WHERE id = ?`).get(sessionId) as
    | { checkpoint?: string | null }
    | undefined
  return row?.checkpoint ?? null
}

function rowToSummary(row: Record<string, unknown>): SessionSummary {
  const runStatus = (row.run_status || 'idle') as RunStatus
  return {
    id: String(row.id),
    title: String(row.title),
    mode: row.mode === 'goal' ? 'goal' : 'interactive',
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    paused: runStatus === 'paused',
    goal: row.goal ? String(row.goal) : undefined,
    runStatus,
    verifyCommand: row.verify_command ? String(row.verify_command) : undefined,
    projectId: row.project_id != null ? String(row.project_id) : null,
    model: row.model != null ? String(row.model) : null
  }
}
