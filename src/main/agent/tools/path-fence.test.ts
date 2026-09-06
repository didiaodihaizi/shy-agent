import { describe, expect, it } from 'vitest'
import { join } from 'path'
import { assertWithinWorkspace, isPathWithinRoot } from './path-fence'

describe('isPathWithinRoot', () => {
  const root = join('/Users/me/proj')

  it('root 自身与子路径通过', () => {
    expect(isPathWithinRoot(root, root)).toBe(true)
    expect(isPathWithinRoot(join(root, 'a/b.txt'), root)).toBe(true)
  })

  it('.. 逃逸与无关绝对路径拒绝', () => {
    expect(isPathWithinRoot(join(root, '..', 'other'), root)).toBe(false)
    expect(isPathWithinRoot('/etc/hosts', root)).toBe(false)
  })

  it('同前缀但非子目录拒绝', () => {
    expect(isPathWithinRoot(`${root}-evil/x`, root)).toBe(false)
  })
})

describe('assertWithinWorkspace', () => {
  const root = join('/tmp/shy-ws')

  it('区内 ok，区外带中文错误', () => {
    expect(assertWithinWorkspace(join(root, 'f.md'), root)).toEqual({ ok: true })
    const bad = assertWithinWorkspace('/etc/passwd', root)
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.error).toMatch(/越界|完全访问/)
  })
})
