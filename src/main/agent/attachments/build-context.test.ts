import { describe, expect, it } from 'vitest'
import { buildAttachmentContext } from './build-context'

describe('buildAttachmentContext', () => {
  it('拼装技能摘要 + 非图路径 + imageNotes + 用户正文', () => {
    const text = buildAttachmentContext({
      userText: '请根据附件回答',
      skillSummaries: [
        { id: 'demo', name: 'Demo Skill', description: '演示技能摘要' }
      ],
      pathAttachments: [
        {
          path: '/tmp/doc.pdf',
          name: 'doc.pdf',
          mime: 'application/pdf',
          kind: 'file'
        }
      ],
      imageNotes: [{ path: '/tmp/a.png', name: 'a.png', note: '红色方块示意图' }]
    })
    expect(text).toContain('Demo Skill')
    expect(text).toContain('演示技能摘要')
    expect(text).toContain('/tmp/doc.pdf')
    expect(text).toContain('application/pdf')
    expect(text).toContain('红色方块示意图')
    expect(text).toContain('请根据附件回答')
  })

  it('无附件与技能时仅返回用户正文', () => {
    expect(
      buildAttachmentContext({
        userText: 'hello',
        skillSummaries: [],
        pathAttachments: [],
        imageNotes: []
      })
    ).toBe('hello')
  })

  it('不含原始 image_url 或 data:image 二进制片段', () => {
    const text = buildAttachmentContext({
      userText: '看图',
      skillSummaries: [],
      pathAttachments: [],
      imageNotes: [{ path: '/x.png', name: 'x.png', note: '一只猫' }]
    })
    expect(text).not.toMatch(/image_url/)
    expect(text).not.toMatch(/data:image\//)
  })
})
