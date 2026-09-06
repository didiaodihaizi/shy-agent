import { describe, expect, it } from 'vitest'
import { loadMultimodalImageParts } from './load-multimodal'

describe('loadMultimodalImageParts', () => {
  it('读盘成功则产出 image_url data URL', async () => {
    const result = await loadMultimodalImageParts(
      [{ path: '/tmp/a.png', name: 'a.png', mime: 'image/png' }],
      {
        readFileFn: async () => Buffer.from('hello')
      }
    )
    expect(result.parts).toHaveLength(1)
    expect(result.parts[0]).toMatchObject({ type: 'image_url' })
    const url = (result.parts[0] as { image_url: { url: string } }).image_url.url
    expect(url.startsWith('data:image/png;base64,')).toBe(true)
    expect(result.warnings).toEqual([])
  })

  it('超大文件跳过并 warning', async () => {
    const result = await loadMultimodalImageParts(
      [{ path: '/tmp/big.png', name: 'big.png', mime: 'image/png' }],
      {
        maxBytes: 4,
        readFileFn: async () => Buffer.from('too-big')
      }
    )
    expect(result.parts).toEqual([])
    expect(result.warnings.some((w) => /过大|跳过/.test(w))).toBe(true)
  })
})
