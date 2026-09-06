import { describe, expect, it } from 'vitest'
import {
  appendAttachmentChips,
  appendSkillChip,
  attachmentPreviewSrc,
  classifyAttachmentPath,
  fileNameFromPath
} from './composerAttachments'

describe('classifyAttachmentPath', () => {
  it('marks common image extensions as image', () => {
    expect(classifyAttachmentPath('/tmp/a.PNG')).toMatchObject({
      name: 'a.PNG',
      kind: 'image',
      mime: 'image/png'
    })
  })

  it('marks other files as file', () => {
    expect(classifyAttachmentPath('/tmp/notes.pdf')).toMatchObject({
      name: 'notes.pdf',
      kind: 'file',
      mime: 'application/pdf'
    })
  })
})

describe('append chips', () => {
  it('dedupes skills by id', () => {
    const a = appendSkillChip([], { id: 's1', name: '技能一' })
    const b = appendSkillChip(a, { id: 's1', name: '技能一改' })
    expect(b).toEqual([{ id: 's1', name: '技能一' }])
  })

  it('dedupes attachments by path', () => {
    const list = appendAttachmentChips([], ['/a.png', '/a.png', '/b.txt'])
    expect(list.map((x) => x.path)).toEqual(['/a.png', '/b.txt'])
  })
})

describe('attachmentPreviewSrc', () => {
  it('builds shy-file url for posix path', () => {
    expect(attachmentPreviewSrc('/Users/me/pic.png')).toBe(
      `shy-file://a/${encodeURIComponent('/Users/me/pic.png')}`
    )
  })

  it('fileNameFromPath handles windows separators', () => {
    expect(fileNameFromPath('C:\\tmp\\x.jpg')).toBe('x.jpg')
  })
})
