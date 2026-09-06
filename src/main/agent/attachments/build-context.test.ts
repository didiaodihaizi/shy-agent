import { describe, expect, it } from 'vitest'
import { buildAttachmentContext } from './build-context'

describe('buildAttachmentContext', () => {
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

  it('混合时产出 shy-context 标签树，原文在后', () => {
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
    expect(text).toContain('<shy-context>')
    expect(text).toContain('</shy-context>')
    expect(text).toMatch(
      /<shy-img path="\/tmp\/a\.png" name="a\.png">红色方块示意图<\/shy-img>/
    )
    expect(text).toContain(
      '<shy-file path="/tmp/doc.pdf" name="doc.pdf" mime="application/pdf"/>'
    )
    expect(text).toContain(
      '<shy-skill id="demo" name="Demo Skill">演示技能摘要</shy-skill>'
    )
    expect(text).toMatch(/<\/shy-context>\n\n请根据附件回答$/)
    expect(text).not.toContain('【图片读图结果】')
    expect(text).not.toContain('【用户消息】')
  })

  it('仅图 / 仅文件 / 仅技能', () => {
    expect(
      buildAttachmentContext({
        userText: '看图',
        imageNotes: [{ path: '/x.png', name: 'x.png', note: '一只猫' }]
      })
    ).toContain('<shy-img path="/x.png" name="x.png">一只猫</shy-img>')

    expect(
      buildAttachmentContext({
        userText: '读文件',
        pathAttachments: [
          { path: '/a.txt', name: 'a.txt', mime: 'text/plain', kind: 'file' }
        ]
      })
    ).toContain('<shy-file path="/a.txt" name="a.txt" mime="text/plain"/>')

    expect(
      buildAttachmentContext({
        userText: '用技能',
        skillSummaries: [{ id: 's1', name: '技能A' }]
      })
    ).toContain('<shy-skill id="s1" name="技能A"/>')
  })

  it('读图正文含特殊字符时转义', () => {
    const text = buildAttachmentContext({
      userText: '看',
      imageNotes: [{ path: '/p.png', name: 'p.png', note: '含 <tag> & "引号"' }]
    })
    expect(text).toContain('含 &lt;tag&gt; &amp; "引号"')
    expect(text).not.toContain('<tag>')
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
