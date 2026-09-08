import { describe, expect, it } from 'vitest'
import { historyMessageToUiMsg } from './historyMessageToUiMsg'

describe('historyMessageToUiMsg', () => {
  it('还原 tool meta', () => {
    const msg = historyMessageToUiMsg({
      id: '1',
      role: 'tool',
      content: 'web_fetch',
      createdAt: 't',
      meta: {
        toolId: 'tc-9',
        toolName: 'web_fetch',
        toolStatus: 'done',
        toolInput: { url: 'https://x' },
        toolResult: { ok: 1 }
      }
    })
    expect(msg).toMatchObject({
      role: 'tool',
      toolId: 'tc-9',
      toolName: 'web_fetch',
      toolStatus: 'done',
      toolInput: { url: 'https://x' },
      toolResult: { ok: 1 }
    })
  })

  it('还原 reasoning durationMs', () => {
    const msg = historyMessageToUiMsg({
      id: '2',
      role: 'reasoning',
      content: '想了想',
      createdAt: 't',
      meta: { durationMs: 800 }
    })
    expect(msg).toMatchObject({ role: 'reasoning', content: '想了想', durationMs: 800 })
  })
})
