import type { ModelSettings } from '../../shared/ipc'

export type LlmProvider = 'custom' | 'opencode-go'

export const OPENCODE_GO_BASE_URL = 'https://opencode.ai/zen/go/v1'

/** OpenCode Go 要求识别客户端；勿用通用 SDK UA */
export const SHY_USER_AGENT = 'shy/1.0'
export const OPENCODE_CLIENT_ID = 'shy'
/** 无会话上下文时的兜底路由键（如偶发辅助请求） */
export const OPENCODE_GO_FALLBACK_SESSION = 'shy-aux'

export type ResolveLlmSession = {
  id?: string | null
  model?: string | null
}

export type ResolvedLlmConfig = {
  baseURL: string
  apiKey: string
  model: string
  /** OpenCode Go 等网关需要的默认请求头 */
  defaultHeaders?: Record<string, string>
}

export function normalizeProvider(value: unknown): LlmProvider {
  return value === 'opencode-go' ? 'opencode-go' : 'custom'
}

function normalizeSessionModel(value?: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function normalizeSessionId(value?: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

/** Go 网关会话亲和 + 客户端标识（缺 session 也会给稳定兜底，避免 400） */
export function buildOpenCodeGoHeaders(sessionId?: string | null): Record<string, string> {
  return {
    'x-opencode-session': normalizeSessionId(sessionId) ?? OPENCODE_GO_FALLBACK_SESSION,
    'x-opencode-client': OPENCODE_CLIENT_ID,
    'User-Agent': SHY_USER_AGENT
  }
}

export function resolveLlmConfig(
  settings: ModelSettings,
  session?: ResolveLlmSession | null
): ResolvedLlmConfig {
  const provider = normalizeProvider(settings.provider)
  const model = normalizeSessionModel(session?.model) ?? settings.model
  const baseURL = provider === 'opencode-go' ? OPENCODE_GO_BASE_URL : settings.baseURL

  return {
    baseURL,
    apiKey: settings.apiKey,
    model,
    ...(provider === 'opencode-go'
      ? { defaultHeaders: buildOpenCodeGoHeaders(session?.id) }
      : {})
  }
}
