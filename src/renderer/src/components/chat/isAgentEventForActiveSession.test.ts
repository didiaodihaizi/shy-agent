import { describe, expect, it } from 'vitest'
import { isAgentEventForActiveSession } from './isAgentEventForActiveSession'

describe('isAgentEventForActiveSession', () => {
  it('匹配当前会话时放行', () => {
    expect(isAgentEventForActiveSession('ses-a', 'ses-a')).toBe(true)
  })

  it('旧会话事件在已切到新会话后拦截', () => {
    expect(isAgentEventForActiveSession('ses-old', 'ses-new')).toBe(false)
  })

  it('缺 sessionId 时拦截（失败封闭）', () => {
    expect(isAgentEventForActiveSession(undefined, 'ses-a')).toBe(false)
  })
})
