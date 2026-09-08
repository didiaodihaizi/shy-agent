import { normalizeProvider, resolveLlmConfig } from '../llm-config'
import { getSettings } from '../../settings/store'
import { getSession } from '../../sessions/store'
import { listSkills } from '../../skills/store'
import { isVisionCapable } from './vision-model'
import type { ChatAttachment } from './read-images'
import { buildAttachmentContext } from './build-context'

export type PrepareImagePart = {
  path: string
  name: string
  mime: string
}

export type PrepareAttachmentMessageInput = {
  sessionId: string
  message: string
  skills?: { id: string; name: string }[]
  attachments?: ChatAttachment[]
  emitStatus?: (message: string) => void
  emitNotify?: (message: string) => void
}

export type PrepareAttachmentMessageResult = {
  message: string
  /** 会话模型支持 vision 时，本轮透传的图片（不含二进制） */
  imageParts: PrepareImagePart[]
  warnings: string[]
}

/**
 * 发送前组装 agent 文本上下文 + 可选多模态 imageParts。
 * 不再预读 OCR；vision 能力看会话所选模型。
 */
export async function prepareAttachmentMessage(
  input: PrepareAttachmentMessageInput
): Promise<PrepareAttachmentMessageResult> {
  const skills = input.skills ?? []
  const attachments = input.attachments ?? []
  if (skills.length === 0 && attachments.length === 0) {
    return { message: input.message, imageParts: [], warnings: [] }
  }

  const settings = await getSettings()
  const session = getSession(input.sessionId)
  const llm = resolveLlmConfig(settings, { id: input.sessionId, model: session?.model })
  void normalizeProvider(settings.provider)

  const sessionModelCapable = isVisionCapable(llm.model)
  const images = attachments.filter((a) => a.kind === 'image')
  const files = attachments.filter((a) => a.kind !== 'image')
  const warnings: string[] = []

  let imageParts: PrepareImagePart[] = []
  let pathAttachments: ChatAttachment[] = [...files]

  if (images.length > 0) {
    if (sessionModelCapable) {
      imageParts = images.map((a) => ({
        path: a.path,
        name: a.name,
        mime: a.mime || 'application/octet-stream'
      }))
    } else {
      pathAttachments = [...files, ...images]
      warnings.push('当前会话模型不支持视觉，图片已按路径附件发送')
      input.emitNotify?.(warnings[warnings.length - 1]!)
    }
  }

  const allSkills = skills.length > 0 ? await listSkills() : []
  const byKey = new Map<string, (typeof allSkills)[number]>()
  for (const s of allSkills) {
    byKey.set(s.id, s)
    byKey.set(s.name, s)
  }
  const skillSummaries = skills.map((ref) => {
    const hit = byKey.get(ref.id) ?? byKey.get(ref.name)
    return {
      id: ref.id,
      name: hit?.name ?? ref.name,
      description: hit?.description
    }
  })

  const message = buildAttachmentContext({
    userText: input.message,
    skillSummaries,
    pathAttachments,
    imageNotes: []
  })

  return { message, imageParts, warnings }
}
