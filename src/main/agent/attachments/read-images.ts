export type ChatAttachment = {
  path: string
  name: string
  mime: string
  kind: 'image' | 'file'
}

export type ImageNote = {
  path: string
  name: string
  note: string
}

export type ReadImagesResult = {
  imageNotes: ImageNote[]
  pathAttachments: ChatAttachment[]
  warnings: string[]
}

export type ReadImagesDeps = {
  attachments: ChatAttachment[]
  visionModel: string | null
  llm: { baseURL: string; apiKey: string }
  fetchFn?: typeof fetch
  readFileFn?: (path: string) => Promise<Buffer>
}

const READ_IMAGE_PROMPT =
  '请用简洁中文描述这张图片的主要内容、文字与关键细节，供后续文本模型理解。不要输出 JSON。'

function joinBaseUrl(baseURL: string, path: string): string {
  return `${baseURL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

async function defaultReadFile(path: string): Promise<Buffer> {
  const { readFile } = await import('fs/promises')
  return readFile(path)
}

async function invokeVisionNote(input: {
  attachment: ChatAttachment
  visionModel: string
  llm: { baseURL: string; apiKey: string }
  fetchFn: typeof fetch
  bytes: Buffer
}): Promise<string> {
  const dataUrl = `data:${input.attachment.mime || 'application/octet-stream'};base64,${input.bytes.toString('base64')}`
  const url = joinBaseUrl(input.llm.baseURL, 'chat/completions')
  const res = await input.fetchFn(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.llm.apiKey}`
    },
    body: JSON.stringify({
      model: input.visionModel,
      temperature: 0.2,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: READ_IMAGE_PROMPT },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }
      ]
    })
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>
  }
  const note = payload.choices?.[0]?.message?.content?.trim() ?? ''
  if (!note) throw new Error('empty vision response')
  return note
}

/**
 * 对图片附件做 vision 读图；无 vision / 单张失败时降级为 pathAttachments。
 * 非图片附件一律进入 pathAttachments。用户模型侧不会收到原图。
 */
export async function readImages(deps: ReadImagesDeps): Promise<ReadImagesResult> {
  const attachments = deps.attachments ?? []
  if (attachments.length === 0) {
    return { imageNotes: [], pathAttachments: [], warnings: [] }
  }

  const images = attachments.filter((a) => a.kind === 'image')
  const imageNotes: ImageNote[] = []
  const warnings: string[] = []
  const pathAttachments: ChatAttachment[] = []

  if (images.length === 0) {
    return { imageNotes, pathAttachments: [...attachments], warnings }
  }

  if (!deps.visionModel) {
    warnings.push('当前提供方无可用视觉模型，图片已降级为路径附件')
    return { imageNotes, pathAttachments: [...attachments], warnings }
  }

  const fetchFn = deps.fetchFn ?? fetch
  const readFileFn = deps.readFileFn ?? defaultReadFile
  const notedPaths = new Set<string>()

  for (const image of images) {
    try {
      const bytes = await readFileFn(image.path)
      const note = await invokeVisionNote({
        attachment: image,
        visionModel: deps.visionModel,
        llm: deps.llm,
        fetchFn,
        bytes
      })
      imageNotes.push({ path: image.path, name: image.name, note })
      notedPaths.add(image.path)
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      warnings.push(`读图失败（${image.name}）：${reason}，已降级为路径附件`)
    }
  }

  for (const a of attachments) {
    if (a.kind === 'image' && notedPaths.has(a.path)) continue
    pathAttachments.push(a)
  }

  return { imageNotes, pathAttachments, warnings }
}
