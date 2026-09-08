import { describe, expect, it } from 'vitest'
import {
  applyChatAgentEvent,
  emptySessionChatSnapshot
} from './sessionChatCache'

describe('sessionChatCache', () => {
  it('切会话前缓存的工具行可被后续 tool_result 更新', () => {
    let snap = emptySessionChatSnapshot()
    snap = applyChatAgentEvent(snap, {
      type: 'tool_call',
      id: 't1',
      name: 'web_fetch',
      input: { url: 'https://a.com' }
    })
    expect(snap.messages.some((m) => m.role === 'tool' && m.toolId === 't1')).toBe(true)
    snap = applyChatAgentEvent(snap, {
      type: 'tool_result',
      id: 't1',
      output: { ok: true }
    })
    const tool = snap.messages.find((m) => m.toolId === 't1')
    expect(tool?.toolStatus).toBe('done')
    expect(tool?.toolResult).toEqual({ ok: true })
  })

  it('离屏会话收到 assistant_delta / done 后 busy 结束且保留正文', () => {
    let snap = emptySessionChatSnapshot()
    snap = {
      ...snap,
      busy: true,
      messages: [{ role: 'user', content: 'hi', createdAt: '1' }]
    }
    snap = applyChatAgentEvent(snap, { type: 'assistant_delta', content: '你好' })
    snap = applyChatAgentEvent(snap, { type: 'assistant_delta', content: '世界' })
    snap = applyChatAgentEvent(snap, { type: 'done', reason: 'completed' })
    expect(snap.busy).toBe(false)
    expect(snap.messages.some((m) => m.role === 'assistant' && m.content.includes('你好'))).toBe(
      true
    )
  })

  it('empty 快照可独立演进，互不污染', () => {
    let a = emptySessionChatSnapshot()
    let b = emptySessionChatSnapshot()
    a = applyChatAgentEvent(a, { type: 'tool_call', id: 'a1', name: 'shell_exec' })
    b = applyChatAgentEvent(b, { type: 'notify', message: '仅 B' })
    expect(a.messages.some((m) => m.toolId === 'a1')).toBe(true)
    expect(b.messages.some((m) => m.content === '仅 B')).toBe(true)
    expect(a.messages.some((m) => m.content === '仅 B')).toBe(false)
  })
})
