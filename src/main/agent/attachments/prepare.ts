import { normalizeProvider, resolveLlmConfig } from '../llm-config'
import { listOpenCodeGoModelsFromSettings } from '../../llm/opencode-go-models'
import { getSettings } from '../../settings/store'
import { getSession } from '../../sessions/store'
import { listSkills } from '../../skills/store'
import { pickVisionModel } from './vision-model'
import { readImages, type ChatAttachment } from './read-images'
import { buildAttachmentContext } from './build-context'

export type PrepareAttachmentMessageInput = {
  sessionId: string
  message: string
  skills?: { id: string; name: string }[]
  attachments?: ChatAttachment[]
  /** 状态/轻提示回调（如「正在理解图片…」） */
  emitStatus?: (message: string) => void
  emitNotify?: (message: string) => void
}

/**
 * 发送前：vision 选型 → 读图 → 组装纯文本增强 message。
 * 用户所选模型不会收到原图 / image_url。
 */
export async function prepareAttachmentMessage(
  input: PrepareAttachmentMessageInput
): Promise<{ message: string; warnings: string[] }> {
  const skills = input.skills ?? []
  const attachments = input.attachments ?? []
  if (skills.length === 0 && attachments.length === 0) {
    return { message: input.message, warnings: [] }
  }

  const settings = await getSettings()
  const session = getSession(input.sessionId)
  const llm = resolveLlmConfig(settings, session ?? undefined)

  const provider = normalizeProvider(settings.provider)
  let modelIds: string[] = []
  if (provider === 'opencode-go') {
    try {
      const listed = await listOpenCodeGoModelsFromSettings(settings)
      modelIds = listed.models
    } catch {
      modelIds = [llm.model].filter(Boolean)
    }
  } else {
    modelIds = [session?.model, settings.model].filter(
      (m): m is string => typeof m === 'string' && m.trim().length > 0
    )
  }

  const hasImages = attachments.some((a) => a.kind === 'image')
  const visionModel = hasImages ? pickVisionModel(modelIds) : null

  if (hasImages) {
    input.emitStatus?.('正在理解图片…')
  }

  const readResult = await readImages({
    attachments,
    visionModel,
    llm: { baseURL: llm.baseURL, apiKey: llm.apiKey }
  })

  for (const w of readResult.warnings) {
    input.emitNotify?.(w)
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
    pathAttachments: readResult.pathAttachments,
    imageNotes: readResult.imageNotes
  })

  return { message, warnings: readResult.warnings }
}
