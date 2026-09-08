/**
 * 将会话时间轴定稿事件写入 SQLite（非流式 delta）。
 */
import {
  appendProcessMessage,
  markRunningToolsInterrupted,
  upsertSessionToolMessage
} from '../sessions/store'

export type TimelinePersistEvent = {
  type?: string
  content?: string
  id?: string
  name?: string
  input?: unknown
  output?: unknown
  error?: string
  reason?: string
}

export type TimelinePersistState = {
  reasoningBuf: string
  reasoningStartedAt: number | null
}

export function createTimelinePersistState(): TimelinePersistState {
  return { reasoningBuf: '', reasoningStartedAt: null }
}

/** 处理单条过程事件；返回是否已消费（调用方仍应照常 emit UI） */
export function persistTimelineEvent(
  sessionId: string,
  event: TimelinePersistEvent,
  state: TimelinePersistState
): void {
  switch (event.type) {
    case 'reasoning_delta':
      if (event.content) {
        if (!state.reasoningBuf) state.reasoningStartedAt = Date.now()
        state.reasoningBuf += event.content
      }
      break
    case 'reasoning_done':
      flushReasoning(sessionId, state)
      break
    case 'assistant':
      if (event.content) {
        flushReasoning(sessionId, state)
        appendProcessMessage(sessionId, 'assistant', event.content)
      }
      break
    case 'tool_call':
      if (event.id) {
        upsertSessionToolMessage(sessionId, {
          toolId: event.id,
          toolName: event.name ?? 'tool',
          toolStatus: 'running',
          toolInput: event.input
        })
      }
      break
    case 'tool_result':
      if (event.id) {
        upsertSessionToolMessage(sessionId, {
          toolId: event.id,
          toolName: event.name,
          toolStatus: event.error ? 'failed' : 'done',
          toolResult: event.output,
          toolError: event.error
        })
      }
      break
    case 'done':
      if (event.reason === 'segment') break
      flushReasoning(sessionId, state)
      markRunningToolsInterrupted(sessionId)
      break
    default:
      break
  }
}

function flushReasoning(sessionId: string, state: TimelinePersistState): void {
  const text = state.reasoningBuf.trim()
  if (!text) {
    state.reasoningBuf = ''
    state.reasoningStartedAt = null
    return
  }
  const durationMs =
    state.reasoningStartedAt != null ? Math.max(0, Date.now() - state.reasoningStartedAt) : undefined
  appendProcessMessage(sessionId, 'reasoning', text, durationMs != null ? { durationMs } : undefined)
  state.reasoningBuf = ''
  state.reasoningStartedAt = null
}
