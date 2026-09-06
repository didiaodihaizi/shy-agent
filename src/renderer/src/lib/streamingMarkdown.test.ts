import { describe, expect, it } from 'vitest'
import { hasUnclosedFence, prepareMarkdownForRender } from './streamingMarkdown'

describe('streamingMarkdown', () => {
  it('complete 时原样返回', () => {
    const raw = '```js\nconst x = 1\n'
    expect(prepareMarkdownForRender(raw, true)).toBe(raw)
  })

  it('未完成且未闭合 fence 时补闭合', () => {
    const raw = '前言\n```ts\nconst a = 1\n'
    expect(hasUnclosedFence(raw)).toBe(true)
    expect(prepareMarkdownForRender(raw, false)).toBe(`${raw}\n\`\`\``)
  })

  it('未完成但已闭合时不改', () => {
    const raw = '```\nok\n```\n后文'
    expect(hasUnclosedFence(raw)).toBe(false)
    expect(prepareMarkdownForRender(raw, false)).toBe(raw)
  })
})
