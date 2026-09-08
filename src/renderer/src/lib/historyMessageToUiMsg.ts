/**
 * 将会话历史 ChatMessage 映射为聊天 UI Msg（含 tool/reasoning 过程态）。
 */
import type { ChatMessage } from '../../../shared/ipc'
import { decodeUserMessageContent } from '../../../shared/user-message-meta'

export type HistoryUiMsg = {
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
  skills?: unknown
  attachments?: unknown
}

export function historyMessageToUiMsg(m: ChatMessage): HistoryUiMsg {
  if (m.role === 'user') {
    const { text, meta } = decodeUserMessageContent(m.content)
    return {
      id: m.id,
      role: 'user',
      content: text,
      createdAt: m.createdAt,
      kind: m.kind,
      streaming: false,
      skills: meta.skills,
      attachments: meta.attachments
    }
  }
  if (m.role === 'tool') {
    return {
      id: m.id,
      role: 'tool',
      content: m.content,
      createdAt: m.createdAt,
      streaming: false,
      toolId: m.meta?.toolId ?? m.id,
      toolName: m.meta?.toolName ?? (m.content || 'tool'),
      toolStatus: m.meta?.toolStatus ?? 'done',
      toolInput: m.meta?.toolInput,
      toolResult: m.meta?.toolResult,
      toolError: m.meta?.toolError
    }
  }
  if (m.role === 'reasoning') {
    return {
      id: m.id,
      role: 'reasoning',
      content: m.content,
      createdAt: m.createdAt,
      streaming: false,
      durationMs: m.meta?.durationMs
    }
  }
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
    kind: m.kind,
    streaming: false
  }
}
