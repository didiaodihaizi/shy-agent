import type { ChatAttachment, ImageNote } from './read-images'

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
 * 组装纯文本增强上下文：技能摘要 + 非图路径元数据 + imageNotes + 用户正文。
 * 不含原图二进制 / image_url。
 */
export function buildAttachmentContext(input: BuildAttachmentContextInput): string {
  const skills = input.skillSummaries ?? []
  const paths = input.pathAttachments ?? []
  const notes = input.imageNotes ?? []
  const userText = input.userText ?? ''

  const sections: string[] = []

  if (skills.length > 0) {
    const lines = skills.map((s) => {
      const desc = s.description?.trim()
        ? ` — ${truncate(s.description, DESC_MAX)}`
        : ''
      return `- ${s.name}（id: ${s.id}）${desc}`
    })
    sections.push(`【挂载技能】\n${lines.join('\n')}`)
  }

  if (notes.length > 0) {
    const lines = notes.map(
      (n) => `- ${n.name}（${n.path}）\n  读图结果：${n.note.trim()}`
    )
    sections.push(`【图片读图结果】\n${lines.join('\n')}`)
  }

  if (paths.length > 0) {
    const lines = paths.map(
      (a) => `- ${a.name} | path: ${a.path} | mime: ${a.mime} | kind: ${a.kind}`
    )
    sections.push(`【附件路径】\n${lines.join('\n')}`)
  }

  if (sections.length === 0) {
    return userText
  }

  const prefix = sections.join('\n\n')
  if (!userText.trim()) return prefix
  return `${prefix}\n\n【用户消息】\n${userText}`
}
