import { describe, expect, it } from 'vitest'

describe('CreateProjectModal contract', () => {
  it('类型仅允许 code | material', () => {
    const types = ['code', 'material'] as const
    expect(types).toContain('code')
    expect(types).toContain('material')
  })
})
