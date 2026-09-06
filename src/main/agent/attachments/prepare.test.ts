import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getSettings, getSession, listSkills, resolveLlmConfig } = vi.hoisted(() => ({
  getSettings: vi.fn(),
  getSession: vi.fn(),
  listSkills: vi.fn(),
  resolveLlmConfig: vi.fn()
}))

vi.mock('../../settings/store', () => ({ getSettings }))
vi.mock('../../sessions/store', () => ({ getSession }))
vi.mock('../../skills/store', () => ({ listSkills }))
vi.mock('../llm-config', () => ({
  normalizeProvider: (p: string) => p,
  resolveLlmConfig
}))

import { prepareAttachmentMessage } from './prepare'

beforeEach(() => {
  getSettings.mockResolvedValue({ provider: 'openai', model: 'gpt-test' })
  getSession.mockReturnValue({ id: 's1', model: undefined })
  listSkills.mockResolvedValue([])
  resolveLlmConfig.mockReturnValue({
    baseURL: 'http://mock',
    apiKey: 'k',
    model: 'deepseek-v4-flash'
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('prepareAttachmentMessage', () => {
  it('会话模型支持 vision 时返回 imageParts，不预读 OCR', async () => {
    const prepared = await prepareAttachmentMessage({
      sessionId: 's1',
      message: '看看图',
      attachments: [
        { path: '/tmp/a.png', name: 'a.png', mime: 'image/png', kind: 'image' }
      ]
    })
    expect(prepared.imageParts).toEqual([
      { path: '/tmp/a.png', name: 'a.png', mime: 'image/png' }
    ])
    expect(prepared.message).toBe('看看图')
    expect(prepared.message).not.toContain('读图')
    expect(prepared.message).not.toContain('<shy-img')
  })

  it('会话模型不支持 vision 时图片进路径上下文，无 imageParts', async () => {
    resolveLlmConfig.mockReturnValue({
      baseURL: 'http://mock',
      apiKey: 'k',
      model: 'glm-5.3'
    })
    const notifies: string[] = []
    const prepared = await prepareAttachmentMessage({
      sessionId: 's1',
      message: '看图',
      attachments: [
        { path: '/tmp/a.png', name: 'a.png', mime: 'image/png', kind: 'image' }
      ],
      emitNotify: (m) => notifies.push(m)
    })
    expect(prepared.imageParts).toEqual([])
    expect(prepared.message).toContain('<shy-file')
    expect(prepared.message).toContain('/tmp/a.png')
    expect(notifies.some((n) => /不支持视觉|路径/i.test(n))).toBe(true)
  })
})
