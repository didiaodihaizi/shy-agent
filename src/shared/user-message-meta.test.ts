import { describe, expect, it } from 'vitest'
import {
  decodeUserMessageContent,
  encodeUserMessageContent,
  stripAgentContextForDisplay
} from './user-message-meta'

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
    const decoded = decodeUserMessageContent(encoded)
    expect(decoded.text).toBe('看这张图')
    expect(decoded.meta.skills).toEqual([{ id: 's1', name: '原型' }])
    expect(decoded.meta.attachments?.[0]?.name).toBe('a.png')
  })

  it('误入库的读图上下文只展示用户原文并恢复图片路径', () => {
    const junk = `【图片读图结果】
- 微信图片_a.jpg（/Users/me/微信图片_a.jpg）
  读图结果：木质窗框特写

【用户消息】
帮我看看这是什么`

    const stripped = stripAgentContextForDisplay(junk)
    expect(stripped.text).toBe('帮我看看这是什么')
    expect(stripped.meta.attachments?.[0]).toMatchObject({
      path: '/Users/me/微信图片_a.jpg',
      name: '微信图片_a.jpg',
      kind: 'image'
    })

    const decoded = decodeUserMessageContent(junk)
    expect(decoded.text).toBe('帮我看看这是什么')
    expect(decoded.meta.attachments?.[0]?.path).toBe('/Users/me/微信图片_a.jpg')
  })

  it('只有读图块没有用户正文时展示空文并仍恢复附件', () => {
    const junk = `【图片读图结果】
- shot.png（/tmp/shot.png）
  读图结果：一只猫`
    const decoded = decodeUserMessageContent(junk)
    expect(decoded.text).toBe('')
    expect(decoded.meta.attachments?.[0]?.path).toBe('/tmp/shot.png')
  })
})
