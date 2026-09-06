import { describe, expect, it, vi } from 'vitest'
import type { LLMMessage } from '../llm-client'

describe('turn-runner multimodal user content', () => {
  it('history 带 contentParts 时 llm messages 含 image_url', async () => {
    const seen: LLMMessage[][] = []
    vi.resetModules()
    vi.doMock('../llm-client', () => ({
      streamChatCompletion: async function* (_c: unknown, messages: LLMMessage[]) {
        seen.push(messages)
        yield { type: 'content', delta: 'ok' }
        yield { type: 'done' }
      }
    }))
    const { runTurn } = await import('../turn-runner')
    await runTurn(
      {
        sessionId: 's1',
        history: [
          {
            role: 'user',
            content: '看图',
            contentParts: [
              { type: 'image_url', image_url: { url: 'data:image/png;base64,xxx' } }
            ]
          }
        ],
        tools: [],
        llm: { baseURL: 'http://x', apiKey: 'k', model: 'm' }
      },
      {
        emit: () => undefined,
        getReactGuide: () => 'guide',
        tools: [],
        mode: 'act',
        startTurn: 0
      }
    )
    const user = seen[0]?.find((m) => m.role === 'user')
    expect(user).toBeDefined()
    expect(Array.isArray(user!.content)).toBe(true)
    const parts = user!.content as Array<{ type: string }>
    expect(parts.some((p) => p.type === 'image_url')).toBe(true)
    expect(parts.some((p) => p.type === 'text')).toBe(true)
  })
})
