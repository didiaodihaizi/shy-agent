/** 已知具备视觉能力的模型 id（不依赖名称含 vision 时的兜底） */
export const KNOWN_VISION_MODEL_IDS = ['deepseek-v4-flash-vision-exp'] as const

const KNOWN_VISION_SET = new Set<string>(KNOWN_VISION_MODEL_IDS)

/**
 * 判断单个模型 id 是否具备视觉/多模态能力（启发式）。
 * deepseek-v4* 按产品确认视为多模态会话模型。
 */
export function isVisionCapable(modelId: string): boolean {
  const id = modelId.trim()
  if (!id) return false
  const lower = id.toLowerCase()
  if (lower.includes('vision') || lower.includes('-vl') || lower.includes('_vl')) return true
  if (KNOWN_VISION_SET.has(id) || KNOWN_VISION_SET.has(lower)) return true
  if (lower.startsWith('deepseek-v4')) return true
  return false
}

/**
 * 从模型列表中按启发式挑选 vision 模型（兼容旧调用方）。
 * 优先 id 含 vision / vl；其次白名单与 deepseek-v4*。
 */
export function pickVisionModel(ids: string[]): string | null {
  for (const id of ids) {
    if (typeof id === 'string' && isVisionCapable(id)) {
      return id.trim()
    }
  }
  return null
}
