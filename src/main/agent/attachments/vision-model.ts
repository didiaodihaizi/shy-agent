/** 已知具备视觉能力的模型 id（不依赖名称含 vision 时的兜底） */
export const KNOWN_VISION_MODEL_IDS = ['deepseek-v4-flash-vision-exp'] as const

const KNOWN_VISION_SET = new Set<string>(KNOWN_VISION_MODEL_IDS)

function isVisionModelId(id: string): boolean {
  const lower = id.toLowerCase()
  return lower.includes('vision') || KNOWN_VISION_SET.has(id)
}

/**
 * 从当前 provider 模型列表中按启发式挑选 vision 模型。
 * 优先 id 含 `vision`；其次已知白名单；无则返回 null。
 */
export function pickVisionModel(ids: string[]): string | null {
  for (const id of ids) {
    if (typeof id === 'string' && id.trim() && isVisionModelId(id.trim())) {
      return id.trim()
    }
  }
  return null
}
