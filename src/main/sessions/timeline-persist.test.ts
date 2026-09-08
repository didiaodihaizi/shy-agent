import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

vi.mock('electron', () => ({
  app: { getPath: () => process.env.SHY_HOME ?? tmpdir() }
}))

let tmpDir = ''

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'shy-timeline-persist-'))
  process.env.SHY_HOME = tmpDir
  vi.resetModules()
})

afterEach(() => {
  delete process.env.SHY_HOME
  rmSync(tmpDir, { recursive: true, force: true })
})

describe('timeline-persist', () => {
  it('reasoning delta 缓冲，done 时落盘；tool call/result upsert', async () => {
    const store = await import('./store')
    const { createTimelinePersistState, persistTimelineEvent } = await import('./timeline-persist')
    const s = store.createSession()
    const st = createTimelinePersistState()
    persistTimelineEvent(s.id, { type: 'reasoning_delta', content: '想' }, st)
    persistTimelineEvent(s.id, { type: 'reasoning_delta', content: '一下' }, st)
    persistTimelineEvent(s.id, { type: 'reasoning_done' }, st)
    persistTimelineEvent(
      s.id,
      { type: 'tool_call', id: 't1', name: 'shell_exec', input: { command: 'date' } },
      st
    )
    persistTimelineEvent(s.id, { type: 'tool_result', id: 't1', output: 'ok' }, st)
    persistTimelineEvent(s.id, { type: 'assistant', content: '今天是周一' }, st)
    const msgs = store.getSession(s.id)?.messages ?? []
    expect(msgs.some((m) => m.role === 'reasoning' && m.content === '想一下')).toBe(true)
    expect(msgs.filter((m) => m.role === 'tool')).toHaveLength(1)
    expect(msgs.find((m) => m.role === 'tool')?.meta?.toolStatus).toBe('done')
    expect(msgs.some((m) => m.role === 'assistant' && m.content === '今天是周一')).toBe(true)
  })

  it('done 时冲掉未闭合 reasoning，并把 running tool 标 failed', async () => {
    const store = await import('./store')
    const { createTimelinePersistState, persistTimelineEvent } = await import('./timeline-persist')
    const s = store.createSession()
    const st = createTimelinePersistState()
    persistTimelineEvent(s.id, { type: 'reasoning_delta', content: '半截' }, st)
    persistTimelineEvent(
      s.id,
      { type: 'tool_call', id: 't2', name: 'web_fetch', input: { url: 'x' } },
      st
    )
    persistTimelineEvent(s.id, { type: 'done', reason: 'cancelled' }, st)
    const msgs = store.getSession(s.id)?.messages ?? []
    expect(msgs.some((m) => m.role === 'reasoning' && m.content === '半截')).toBe(true)
    expect(msgs.find((m) => m.meta?.toolId === 't2')?.meta?.toolStatus).toBe('failed')
  })
})
