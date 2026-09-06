import { describe, expect, it } from 'vitest'
import { escapeShyAttr, escapeShyText } from './shy-context-escape'

describe('shy-context-escape', () => {
  it('转义属性中的特殊字符', () => {
    expect(escapeShyAttr(`a&b<"c">`)).toBe('a&amp;b&lt;&quot;c&quot;&gt;')
  })

  it('转义正文中的特殊字符', () => {
    expect(escapeShyText(`图示 <cat> & dog`)).toBe('图示 &lt;cat&gt; &amp; dog')
  })
})
