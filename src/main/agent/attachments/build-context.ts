import type { ChatAttachment, ImageNote } from './read-images'
import { escapeShyAttr, escapeShyText } from './shy-context-escape'

export type SkillSummaryForContext = {
  id: string
  name: string
  description?: string
}

export type BuildAttachmentContextInput = {
  userText: string
  skillSummaries?: SkillSummaryForContext[]
  pathAttachments?: ChatAttachment[]
  imageNotes?: ImageNote[]
}

const DESC_MAX = 400

function truncate(text: string, max: number): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

/**
 * 组装 agent 通道增强上下文：`<shy-context>` 标签树 + 用户原文。
 * 不含原图二进制 / image_url；无增强时仅返回用户原文。
 */
export function buildAttachmentContext(input: BuildAttachmentContextInput): string {
  const skills = input.skillSummaries ?? []
  const paths = input.pathAttachments ?? []
  const notes = input.imageNotes ?? []
  const userText = input.userText ?? ''

  if (skills.length === 0 && paths.length === 0 && notes.length === 0) {
    return userText
  }

  const lines: string[] = ['<shy-context>']

  for (const n of notes) {
    const path = escapeShyAttr(n.path)
    const name = escapeShyAttr(n.name)
    const body = escapeShyText(n.note.trim())
    lines.push(`<shy-img path="${path}" name="${name}">${body}</shy-img>`)
  }

  for (const a of paths) {
    const path = escapeShyAttr(a.path)
    const name = escapeShyAttr(a.name)
    const mime = escapeShyAttr(a.mime)
    lines.push(`<shy-file path="${path}" name="${name}" mime="${mime}"/>`)
  }

  for (const s of skills) {
    const id = escapeShyAttr(s.id)
    const name = escapeShyAttr(s.name)
    const desc = s.description?.trim()
    if (desc) {
      lines.push(
        `<shy-skill id="${id}" name="${name}">${escapeShyText(truncate(desc, DESC_MAX))}</shy-skill>`
      )
    } else {
      lines.push(`<shy-skill id="${id}" name="${name}"/>`)
    }
  }

  lines.push('</shy-context>')
  const block = lines.join('\n')
  if (!userText.trim()) return block
  return `${block}\n\n${userText}`
}
