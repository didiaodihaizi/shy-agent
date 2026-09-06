import { describe, expect, it } from 'vitest'
import { isVisionCapable, pickVisionModel } from './vision-model'

describe('isVisionCapable', () => {
  it('deepseek-v4 系列视为多模态', () => {
    expect(isVisionCapable('deepseek-v4-flash')).toBe(true)
    expect(isVisionCapable('deepseek-v4-pro')).toBe(true)
  })

  it('名称含 vision / vl', () => {
    expect(isVisionCapable('foo-vision')).toBe(true)
    expect(isVisionCapable('qwen-vl-max')).toBe(true)
  })

  it('普通文本模型为 false', () => {
    expect(isVisionCapable('glm-5.3')).toBe(false)
    expect(isVisionCapable('kimi-k3')).toBe(false)
  })
})

describe('pickVisionModel', () => {
  it('优先选择 id 含 vision 的模型', () => {
    expect(
      pickVisionModel(['glm-5.3', 'deepseek-v4-flash-vision-exp', 'kimi-k3'])
    ).toBe('deepseek-v4-flash-vision-exp')
  })

  it('大小写不敏感匹配 vision', () => {
    expect(pickVisionModel(['GPT-4o', 'My-Vision-Model'])).toBe('My-Vision-Model')
  })

  it('无 vision 关键字时仍匹配 deepseek-v4', () => {
    expect(pickVisionModel(['glm-5.3', 'kimi-k3', 'deepseek-v4-flash'])).toBe(
      'deepseek-v4-flash'
    )
  })

  it('无可用 vision 模型时返回 null', () => {
    expect(pickVisionModel(['glm-5.3', 'kimi-k3'])).toBeNull()
  })

  it('空列表返回 null', () => {
    expect(pickVisionModel([])).toBeNull()
  })

  it('多个 vision 模型时取第一个', () => {
    expect(pickVisionModel(['a-vision-1', 'b-vision-2'])).toBe('a-vision-1')
  })
})
