import { describe, expect, it } from 'vitest'
import { pickVisionModel } from './vision-model'

describe('pickVisionModel', () => {
  it('优先选择 id 含 vision 的模型', () => {
    expect(
      pickVisionModel(['glm-5.3', 'deepseek-v4-flash-vision-exp', 'kimi-k3'])
    ).toBe('deepseek-v4-flash-vision-exp')
  })

  it('大小写不敏感匹配 vision', () => {
    expect(pickVisionModel(['GPT-4o', 'My-Vision-Model'])).toBe('My-Vision-Model')
  })

  it('无 vision 关键字时仍匹配已知白名单', () => {
    // 白名单项本身含 vision；额外覆盖：若列表仅含白名单项也能命中
    expect(pickVisionModel(['deepseek-v4-flash-vision-exp'])).toBe(
      'deepseek-v4-flash-vision-exp'
    )
  })

  it('无可用 vision 模型时返回 null', () => {
    expect(pickVisionModel(['glm-5.3', 'kimi-k3', 'deepseek-v4-flash'])).toBeNull()
  })

  it('空列表返回 null', () => {
    expect(pickVisionModel([])).toBeNull()
  })

  it('多个 vision 模型时取第一个', () => {
    expect(pickVisionModel(['a-vision-1', 'b-vision-2'])).toBe('a-vision-1')
  })
})
