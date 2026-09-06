import { describe, expect, it } from 'vitest'
import { decodeUserMessageContent, encodeUserMessageContent } from './user-message-meta'

describe('user-message-meta', () => {
  it('无 meta 时原样往返', () => {
    expect(decodeUserMessageContent('你好')).toEqual({ text: '你好', meta: {} })
    expect(encodeUserMessageContent('你好', {})).toBe('你好')
  })

  it('编码后再解码可还原技能与附件', () => {
    const encoded = encodeUserMessageContent('看这张图', {
      skills: [{ id: 's1', name: '原型' }],
      attachments: [
        { path: '/tmp/a.png', name: 'a.png', mime: 'image/png', kind: 'image' }
      ]
    })
    expect(encoded).toContain('看这张图')
    expect(encoded).toContain('shy-msg-meta')
    const decoded = decodeUserMessageContent(encoded)
    expect(decoded.text).toBe('看这张图')
    expect(decoded.meta.skills).toEqual([{ id: 's1', name: '原型' }])
    expect(decoded.meta.attachments?.[0]?.name).toBe('a.png')
  })
})
