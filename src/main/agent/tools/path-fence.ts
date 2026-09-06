import { isAbsolute, relative, resolve, sep } from 'path'

/**
 * 判断绝对路径是否落在 root 之内（含 root 自身）。
 * 用 relative 判断，避免简单 startsWith 的前缀误判。
 */
export function isPathWithinRoot(absPath: string, root: string): boolean {
  const abs = resolve(absPath)
  const base = resolve(root)
  if (abs === base) return true
  const rel = relative(base, abs)
  if (!rel || rel === '') return true
  // 逃出 root：以 .. 开头，或为绝对路径（跨盘）
  if (isAbsolute(rel)) return false
  if (rel === '..' || rel.startsWith(`..${sep}`)) return false
  return true
}

export function assertWithinWorkspace(
  absPath: string,
  workspaceRoot: string
): { ok: true } | { ok: false; error: string } {
  if (isPathWithinRoot(absPath, workspaceRoot)) return { ok: true }
  return {
    ok: false,
    error: `路径越界：默认权限仅允许访问工作区（${workspaceRoot}）内的文件。可在「默认权限」中开启「允许完全访问」。`
  }
}
