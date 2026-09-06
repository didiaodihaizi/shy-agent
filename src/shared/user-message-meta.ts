export type UserMessageSkillMeta = { id: string; name: string }

export type UserMessageAttachmentMeta = {
  path: string
  name: string
  mime: string
  kind: 'image' | 'file'
}

export type UserMessageMeta = {
  skills?: UserMessageSkillMeta[]
  attachments?: UserMessageAttachmentMeta[]
}

const META_RE = /\n\n<!--shy-msg-meta:(.*?)-->\s*$/s

/** 把技能/附件元数据挂到用户消息正文末尾（仅 UI 持久化；展示时剥离）。 */
export function encodeUserMessageContent(text: string, meta: UserMessageMeta): string {
  const skills = meta.skills?.length ? meta.skills : undefined
  const attachments = meta.attachments?.length ? meta.attachments : undefined
  if (!skills && !attachments) return text
  return `${text}\n\n<!--shy-msg-meta:${JSON.stringify({ skills, attachments })}-->`
}

export function decodeUserMessageContent(content: string): {
  text: string
  meta: UserMessageMeta
} {
  const m = content.match(META_RE)
  if (!m?.[1]) return { text: content, meta: {} }
  try {
    const parsed = JSON.parse(m[1]) as UserMessageMeta
    return {
      text: content.slice(0, m.index).trimEnd(),
      meta: {
        skills: Array.isArray(parsed.skills) ? parsed.skills : undefined,
        attachments: Array.isArray(parsed.attachments) ? parsed.attachments : undefined
      }
    }
  } catch {
    return { text: content, meta: {} }
  }
}
