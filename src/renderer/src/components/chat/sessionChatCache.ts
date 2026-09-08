/**
 * 按会话缓存聊天 UI 快照（含工具时间轴）。
 * 工具/流式内容未落库，切会话时必须缓存，否则会丢。
 */
import { enqueueStreamDelta, mergeAssistantSnapshot, type PendingDelta } from '../../lib/streamingDelta'
import { splitAssistantContent } from '../../lib/splitAssistantContent'

export type ChatMsg = {
  id?: string
  role: 'user' | 'assistant' | 'system' | 'tool' | 'reasoning'
  content: string
  createdAt?: string
  kind?: 'result'
  streaming?: boolean
  toolStatus?: 'running' | 'done' | 'failed'
  toolId?: string
  toolName?: string
  toolInput?: unknown
  toolResult?: unknown
  toolError?: string
  durationMs?: number
  reasoningStartedAt?: number
  skills?: unknown
  attachments?: unknown
}

export type SessionChatSnapshot = {
  messages: ChatMsg[]
  streamingTurn: ChatMsg[]
  pendingDelta: PendingDelta | null
  busy: boolean
  paused: boolean
  status: string
  turnStartedAt: number | null
  lastResult: {
    tokenUsed: number
    rounds: number
    durationMs: number
    reportPath?: string
    at: number
  } | null
}

export type ChatAgentEvent = {
  type?: string
  content?: string
  message?: string
  name?: string
  detail?: unknown
  reason?: string
  reportPath?: string
  rounds?: number
  tokenUsed?: number
  durationMs?: number
  id?: string
  input?: unknown
  output?: unknown
  error?: string
  requestId?: string
  question?: string
  options?: string[]
}

export function emptySessionChatSnapshot(): SessionChatSnapshot {
  return {
    messages: [],
    streamingTurn: [],
    pendingDelta: null,
    busy: false,
    paused: false,
    status: '',
    turnStartedAt: null,
    lastResult: null
  }
}

function flushPending(snap: SessionChatSnapshot): SessionChatSnapshot {
  const pending = snap.pendingDelta
  if (!pending) return snap
  const current = snap.streamingTurn
  const last = current.at(-1)
  const next =
    last?.role === pending.role
      ? [
          ...current.slice(0, -1),
          { ...last, content: last.content + pending.content, streaming: true }
        ]
      : [
          ...current,
          {
            role: pending.role,
            content: pending.content,
            createdAt: new Date().toISOString(),
            streaming: true,
            ...(pending.role === 'reasoning' ? { reasoningStartedAt: Date.now() } : {})
          }
        ]
  return { ...snap, streamingTurn: next, pendingDelta: null }
}

function commitStreaming(snap: SessionChatSnapshot): SessionChatSnapshot {
  const flushed = flushPending(snap)
  if (!flushed.streamingTurn.length) return flushed
  return {
    ...flushed,
    messages: [
      ...flushed.messages,
      ...flushed.streamingTurn.map((m) => ({ ...m, streaming: false }))
    ],
    streamingTurn: []
  }
}

function queueDelta(
  snap: SessionChatSnapshot,
  role: 'assistant' | 'reasoning',
  content: string
): SessionChatSnapshot {
  const { flush, pending } = enqueueStreamDelta(snap.pendingDelta, role, content)
  let next = snap
  if (flush) {
    next = flushPending({ ...snap, pendingDelta: flush })
  }
  return { ...next, pendingDelta: pending }
}

/** 把一条 Agent 事件折叠进会话快照（用于当前 UI 或离屏缓存） */
export function applyChatAgentEvent(
  snap: SessionChatSnapshot,
  ev: ChatAgentEvent
): SessionChatSnapshot {
  switch (ev.type) {
    case 'result': {
      if (!ev.content) return snap
      const flushed = flushPending(snap)
      return {
        ...flushed,
        streamingTurn: [],
        messages: [
          ...flushed.messages,
          ...flushed.streamingTurn.map((m) => ({ ...m, streaming: false })),
          {
            role: 'assistant',
            content: ev.content,
            createdAt: new Date().toISOString(),
            kind: 'result'
          }
        ]
      }
    }
    case 'reasoning_delta':
      return ev.content ? queueDelta(snap, 'reasoning', ev.content) : snap
    case 'reasoning_done': {
      const flushed = flushPending(snap)
      const current = flushed.streamingTurn
      let idx = -1
      for (let i = current.length - 1; i >= 0; i--) {
        if (current[i]?.role === 'reasoning') {
          idx = i
          break
        }
      }
      if (idx < 0) return flushed
      const last = current[idx]!
      const next = [...current]
      next[idx] = {
        ...last,
        streaming: false,
        durationMs: Math.max(0, Date.now() - (last.reasoningStartedAt ?? Date.now()))
      }
      return { ...flushed, streamingTurn: next }
    }
    case 'assistant_delta':
      return ev.content ? queueDelta(snap, 'assistant', ev.content) : snap
    case 'assistant': {
      if (!ev.content) return snap
      const flushed = flushPending(snap)
      const split = splitAssistantContent(ev.content)
      if (flushed.streamingTurn.length > 0) {
        const next = mergeAssistantSnapshot(flushed.streamingTurn, split, ev.content, (role, content) => ({
          role,
          content,
          createdAt: new Date().toISOString(),
          streaming: false,
          ...(role === 'reasoning' ? { reasoningStartedAt: Date.now() } : {})
        }))
        return { ...flushed, streamingTurn: next }
      }
      const body = split.body || ev.content
      const prev = flushed.messages
      const last = prev.at(-1)
      if (last && last.role === 'assistant' && !last.kind) {
        return {
          ...flushed,
          messages: [...prev.slice(0, -1), { ...last, content: body, streaming: false }]
        }
      }
      const extra: ChatMsg[] = []
      if (split.thinking) {
        extra.push({
          role: 'reasoning',
          content: split.thinking,
          createdAt: new Date().toISOString(),
          streaming: false
        })
      }
      extra.push({
        role: 'assistant',
        content: body,
        createdAt: new Date().toISOString(),
        streaming: false
      })
      return { ...flushed, messages: [...prev, ...extra] }
    }
    case 'assistant_done':
      return commitStreaming(snap)
    case 'tool_call': {
      if (!ev.id) return snap
      let next = commitStreaming(snap)
      const idx = next.messages.findIndex((m) => m.role === 'tool' && m.toolId === ev.id)
      if (idx >= 0) {
        const messages = [...next.messages]
        messages[idx] = {
          ...messages[idx]!,
          toolName: ev.name ?? messages[idx]!.toolName,
          toolInput: ev.input,
          toolStatus: 'running'
        }
        return { ...next, messages }
      }
      return {
        ...next,
        messages: [
          ...next.messages,
          {
            role: 'tool',
            content: '',
            createdAt: new Date().toISOString(),
            toolId: ev.id,
            toolName: ev.name ?? 'tool',
            toolInput: ev.input,
            toolStatus: 'running'
          }
        ]
      }
    }
    case 'tool_result': {
      if (!ev.id) return snap
      const idx = snap.messages.findIndex((m) => m.role === 'tool' && m.toolId === ev.id)
      if (idx >= 0) {
        const messages = [...snap.messages]
        messages[idx] = {
          ...messages[idx]!,
          toolResult: ev.output,
          toolError: ev.error,
          toolStatus: ev.error ? 'failed' : 'done'
        }
        return { ...snap, messages }
      }
      return {
        ...snap,
        messages: [
          ...snap.messages,
          {
            role: 'tool',
            content: '',
            createdAt: new Date().toISOString(),
            toolId: ev.id,
            toolName: String(ev.id),
            toolResult: ev.output,
            toolError: ev.error,
            toolStatus: ev.error ? 'failed' : 'done'
          }
        ]
      }
    }
    case 'tool':
      return {
        ...snap,
        messages: [
          ...snap.messages,
          {
            role: 'tool',
            content:
              typeof ev.detail === 'string' ? ev.detail : JSON.stringify(ev.detail ?? {}, null, 2),
            toolName: ev.name,
            toolInput: ev.input,
            createdAt: new Date().toISOString(),
            toolStatus: 'running'
          }
        ]
      }
    case 'error':
      return ev.message
        ? {
            ...snap,
            messages: [
              ...snap.messages,
              {
                role: 'system',
                content: `错误：${ev.message}`,
                createdAt: new Date().toISOString()
              }
            ]
          }
        : snap
    case 'notify':
      return ev.message
        ? {
            ...snap,
            messages: [
              ...snap.messages,
              { role: 'system', content: ev.message, createdAt: new Date().toISOString() }
            ]
          }
        : snap
    case 'done': {
      const committed = commitStreaming(snap)
      return {
        ...committed,
        busy: false,
        paused: ev.reason === 'paused',
        status: ev.reason === 'cancelled' ? '已取消' : ev.reason === 'paused' ? '已暂停' : '',
        messages: committed.messages.map((m) =>
          m.role === 'assistant' ? { ...m, streaming: false } : m
        )
      }
    }
    case 'blocked': {
      const rounds = Number(ev.rounds ?? 0)
      return {
        ...snap,
        busy: false,
        paused: true,
        status: '已阻塞',
        messages: [
          ...snap.messages,
          {
            role: 'system',
            content: `目标已阻塞：连续 ${rounds} 轮相同阻塞条件（${ev.reason ?? '未指定原因'}）。请检查或调整目标后继续。`,
            createdAt: new Date().toISOString()
          }
        ]
      }
    }
    case 'goal_complete': {
      const tokenUsed = Number(ev.tokenUsed ?? 0)
      const rounds = Number(ev.rounds ?? 0)
      const durationMs = Number(ev.durationMs ?? 0)
      const durationMin = (durationMs / 60_000).toFixed(1)
      return {
        ...snap,
        lastResult: {
          tokenUsed,
          rounds,
          durationMs,
          reportPath: ev.reportPath,
          at: Date.now()
        },
        messages: [
          ...snap.messages,
          {
            role: 'system',
            content: `✓ 目标完成 · ${tokenUsed.toLocaleString()} tokens · ${rounds} 轮 · ${durationMin} 分钟`,
            createdAt: new Date().toISOString()
          }
        ]
      }
    }
    case 'status':
      if (ev.message?.includes('暂停')) {
        return { ...snap, paused: true, status: '已暂停' }
      }
      return snap
    case 'ask_user': {
      if (!ev.requestId) return snap
      const messages = [...snap.messages]
      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i]
        if (m?.role === 'tool' && m.toolName === 'ask_user' && m.toolStatus === 'running') {
          const prevInput =
            m.toolInput && typeof m.toolInput === 'object' && !Array.isArray(m.toolInput)
              ? (m.toolInput as Record<string, unknown>)
              : {}
          messages[i] = {
            ...m,
            toolInput: {
              ...prevInput,
              question: ev.question ?? prevInput.question,
              options: ev.options ?? prevInput.options,
              requestId: ev.requestId
            }
          }
          return { ...snap, messages }
        }
      }
      return snap
    }
    default:
      return snap
  }
}
