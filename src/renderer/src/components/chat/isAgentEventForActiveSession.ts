/**
 * 判断 Agent 事件是否应应用到当前可见会话。
 * 失败封闭：缺 sessionId 或与当前会话不一致时一律忽略，避免进行中旧会话串进新对话 UI。
 */
export function isAgentEventForActiveSession(
  eventSessionId: string | undefined,
  activeSessionId: string
): boolean {
  return Boolean(eventSessionId) && eventSessionId === activeSessionId
}
