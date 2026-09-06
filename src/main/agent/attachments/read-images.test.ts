import { describe, expect, it, vi } from 'vitest'
import { readImages, type ChatAttachment } from './read-images'

const png: ChatAttachment = {
  path: '/tmp/a.png',
  name: 'a.png',
  mime: 'image/png',
  kind: 'image'
}
const jpg: ChatAttachment = {
  path: '/tmp/b.jpg',
  name: 'b.jpg',
  mime: 'image/jpeg',
  kind: 'image'
}
const pdf: ChatAttachment = {
  path: '/tmp/c.pdf',
  name: 'c.pdf',
  mime: 'application/pdf',
  kind: 'file'
}

function okFetch(content: string): typeof fetch {
  return vi.fn(async () =>
    new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  ) as unknown as typeof fetch
}

describe('readImages', () => {
  it('无 vision 模型时图片降级为 pathAttachments，imageNotes 为空', async () => {
    const result = await readImages({
      attachments: [png, pdf],
      visionModel: null,
      llm: { baseURL: 'https://api.example/v1', apiKey: 'k' },
      fetchFn: vi.fn() as unknown as typeof fetch,
      readFileFn: vi.fn()
    })
    expect(result.imageNotes).toEqual([])
    expect(result.pathAttachments).toEqual([png, pdf])
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings.some((w) => /vision|视觉|读图/i.test(w))).toBe(true)
  })

  it('有 vision 时成功读图得到 notes，非图进入 pathAttachments', async () => {
    const fetchFn = okFetch('一张红色方块')
    const readFileFn = vi.fn(async () => Buffer.from('PNGDATA'))
    const result = await readImages({
      attachments: [png, pdf],
      visionModel: 'deepseek-v4-flash-vision-exp',
      llm: { baseURL: 'https://api.example/v1', apiKey: 'k' },
      fetchFn,
      readFileFn
    })
    expect(result.imageNotes).toEqual([
      { path: png.path, name: png.name, note: '一张红色方块' }
    ])
    expect(result.pathAttachments).toEqual([pdf])
    expect(result.warnings).toEqual([])
    expect(fetchFn).toHaveBeenCalled()
    const [url, init] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit
    ]
    expect(url).toBe('https://api.example/v1/chat/completions')
    const body = JSON.parse(String(init.body)) as {
      model: string
      messages: Array<{ content: unknown }>
    }
    expect(body.model).toBe('deepseek-v4-flash-vision-exp')
    const content = body.messages[0].content as Array<{ type: string; image_url?: { url: string } }>
    expect(content.some((p) => p.type === 'image_url')).toBe(true)
    expect(content.some((p) => p.type === 'text')).toBe(true)
  })

  it('单张读图失败时该图降级为 pathAttachment，其余成功继续', async () => {
    let call = 0
    const fetchFn = vi.fn(async () => {
      call += 1
      if (call === 1) {
        return new Response('fail', { status: 500 })
      }
      return new Response(JSON.stringify({ choices: [{ message: { content: 'ok note' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }) as unknown as typeof fetch
    const readFileFn = vi.fn(async () => Buffer.from('IMG'))
    const result = await readImages({
      attachments: [png, jpg],
      visionModel: 'vision-model',
      llm: { baseURL: 'https://api.example/v1', apiKey: 'k' },
      fetchFn,
      readFileFn
    })
    expect(result.imageNotes).toEqual([{ path: jpg.path, name: jpg.name, note: 'ok note' }])
    expect(result.pathAttachments).toEqual([png])
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('空附件返回空结果', async () => {
    const result = await readImages({
      attachments: [],
      visionModel: 'vision-model',
      llm: { baseURL: 'https://api.example/v1', apiKey: 'k' }
    })
    expect(result).toEqual({ imageNotes: [], pathAttachments: [], warnings: [] })
  })
})
