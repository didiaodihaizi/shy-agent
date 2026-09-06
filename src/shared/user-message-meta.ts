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
const AGENT_SECTION_RE = /【(挂载技能|图片读图结果|附件路径|用户消息)】/

/** 把技能/附件元数据挂到用户消息正文末尾（仅 UI 持久化；展示时剥离）。 */
export function encodeUserMessageContent(text: string, meta: UserMessageMeta): string {
  const skills = meta.skills?.length ? meta.skills : undefined
  const attachments = meta.attachments?.length ? meta.attachments : undefined
  if (!skills && !attachments) return text
  return `${text}\n\n<!--shy-msg-meta:${JSON.stringify({ skills, attachments })}-->`
}

function mimeFromName(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'application/octet-stream'
}

function kindFromName(name: string): 'image' | 'file' {
  return /\.(png|jpe?g|webp|gif|bmp|svg|ico)$/i.test(name) ? 'image' : 'file'
}

/** 从误入库的 agent 上下文中尽量恢复附件路径（兼容旧消息）。 */
export function recoverAttachmentsFromAgentContext(raw: string): UserMessageAttachmentMeta[] {
  const out: UserMessageAttachmentMeta[] = []
  const seen = new Set<string>()

  // 【图片读图结果】- name（/abs/path）
  const noteRe = /^\s*-\s*(.+?)（([^）]+)）\s*$/gm
  let m: RegExpExecArray | null
  while ((m = noteRe.exec(raw))) {
    const name = m[1]!.trim()
    const path = m[2]!.trim()
    if (!path || seen.has(path)) continue
    seen.add(path)
    out.push({ path, name, mime: mimeFromName(name), kind: kindFromName(name) })
  }

  // 【附件路径】- name | path: X | mime: Y | kind: Z
  const pathRe =
    /^\s*-\s*(.+?)\s*\|\s*path:\s*(\S+)\s*\|\s*mime:\s*(\S+)\s*\|\s*kind:\s*(image|file)\s*$/gm
  while ((m = pathRe.exec(raw))) {
    const name = m[1]!.trim()
    const path = m[2]!.trim()
    if (!path || seen.has(path)) continue
    seen.add(path)
    out.push({
      path,
      name,
      mime: m[3]!.trim(),
      kind: m[4] === 'image' ? 'image' : 'file'
    })
  }

  return out
}

function recoverSkillsFromAgentContext(raw: string): UserMessageSkillMeta[] {
  const out: UserMessageSkillMeta[] = []
  const re = /^\s*-\s*(.+?)（id:\s*([^）]+)）/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(raw))) {
    out.push({ id: m[2]!.trim(), name: m[1]!.trim() })
  }
  return out
}

/**
 * 去掉误入库的「挂载技能 / 读图结果 / 附件路径」加工块，只保留用户原文。
 * 若含【用户消息】分段，只取该段之后正文。
 */
export function stripAgentContextForDisplay(content: string): {
  text: string
  meta: UserMessageMeta
} {
  if (!AGENT_SECTION_RE.test(content)) {
    return { text: content, meta: {} }
  }

  const recoveredAttachments = recoverAttachmentsFromAgentContext(content)
  const recoveredSkills = recoverSkillsFromAgentContext(content)

  const marker = '【用户消息】'
  const idx = content.lastIndexOf(marker)
  const text = idx >= 0 ? content.slice(idx + marker.length).trim() : ''

  return {
    text,
    meta: {
      skills: recoveredSkills.length ? recoveredSkills : undefined,
      attachments: recoveredAttachments.length ? recoveredAttachments : undefined
    }
  }
}

export function decodeUserMessageContent(content: string): {
  text: string
  meta: UserMessageMeta
} {
  let body = content
  let meta: UserMessageMeta = {}

  const m = content.match(META_RE)
  if (m?.[1]) {
    try {
      const parsed = JSON.parse(m[1]) as UserMessageMeta
      meta = {
        skills: Array.isArray(parsed.skills) ? parsed.skills : undefined,
        attachments: Array.isArray(parsed.attachments) ? parsed.attachments : undefined
      }
      body = content.slice(0, m.index).trimEnd()
    } catch {
      /* keep body */
    }
  }

  if (AGENT_SECTION_RE.test(body)) {
    const stripped = stripAgentContextForDisplay(body)
    return {
      text: stripped.text,
      meta: {
        skills: meta.skills ?? stripped.meta.skills,
        attachments: meta.attachments ?? stripped.meta.attachments
      }
    }
  }

  return { text: body, meta }
}
