import { readFile } from 'fs/promises'
import type { PrepareImagePart } from './prepare'
import type { LLMContentPart } from '../llm-client'

export const MAX_MULTIMODAL_IMAGES = 8
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024

export type LoadMultimodalResult = {
  parts: LLMContentPart[]
  warnings: string[]
}

/** 本机图片 → data URL image_url parts；超限降级并给出 warnings。 */
export async function loadMultimodalImageParts(
  images: PrepareImagePart[],
  options?: {
    maxImages?: number
    maxBytes?: number
    readFileFn?: (path: string) => Promise<Buffer>
  }
): Promise<LoadMultimodalResult> {
  const maxImages = options?.maxImages ?? MAX_MULTIMODAL_IMAGES
  const maxBytes = options?.maxBytes ?? MAX_IMAGE_BYTES
  const readFileFn = options?.readFileFn ?? readFile
  const warnings: string[] = []
  const parts: LLMContentPart[] = []

  const list = images.slice(0, maxImages)
  if (images.length > maxImages) {
    warnings.push(`图片超过 ${maxImages} 张，仅透传前 ${maxImages} 张`)
  }

  for (const img of list) {
    try {
      const bytes = await readFileFn(img.path)
      if (bytes.byteLength > maxBytes) {
        warnings.push(`图片过大已跳过（${img.name}，上限 ${Math.floor(maxBytes / 1024 / 1024)}MB）`)
        continue
      }
      const mime = img.mime || 'application/octet-stream'
      const url = `data:${mime};base64,${bytes.toString('base64')}`
      parts.push({ type: 'image_url', image_url: { url } })
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      warnings.push(`读取图片失败（${img.name}）：${reason}`)
    }
  }

  return { parts, warnings }
}
