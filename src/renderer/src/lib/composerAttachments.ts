import { previewKind } from './filePreview'

export type ComposerSkillChip = { id: string; name: string }

export type ComposerAttachmentChip = {
  path: string
  name: string
  mime: string
  kind: 'image' | 'file'
}

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.html': 'text/html',
  '.htm': 'text/html'
}

function extname(name: string): string {
  const base = name.replace(/\\/g, '/')
  const slash = base.lastIndexOf('/')
  const file = slash >= 0 ? base.slice(slash + 1) : base
  const dot = file.lastIndexOf('.')
  if (dot <= 0) return ''
  return file.slice(dot).toLowerCase()
}

export function fileNameFromPath(absPath: string): string {
  const normalized = absPath.replace(/\\/g, '/')
  const slash = normalized.lastIndexOf('/')
  return slash >= 0 ? normalized.slice(slash + 1) : normalized
}

export function mimeFromName(name: string): string {
  return MIME_BY_EXT[extname(name)] ?? 'application/octet-stream'
}

/** 按扩展名区分 image | file；mime 由扩展名推断。 */
export function classifyAttachmentPath(absPath: string): ComposerAttachmentChip {
  const name = fileNameFromPath(absPath)
  const kind = previewKind(name) === 'image' ? 'image' : 'file'
  return { path: absPath, name, mime: mimeFromName(name), kind }
}

/** 追加技能 chip（按 id 去重）。 */
export function appendSkillChip(
  list: ComposerSkillChip[],
  skill: ComposerSkillChip
): ComposerSkillChip[] {
  if (list.some((s) => s.id === skill.id)) return list
  return [...list, skill]
}

/** 追加文件 chip（按 path 去重）。 */
export function appendAttachmentChips(
  list: ComposerAttachmentChip[],
  paths: string[]
): ComposerAttachmentChip[] {
  const next = [...list]
  const seen = new Set(list.map((a) => a.path))
  for (const p of paths) {
    if (seen.has(p)) continue
    seen.add(p)
    next.push(classifyAttachmentPath(p))
  }
  return next
}

/** Composer 附件图片预览：shy-file 协议（任意本机绝对路径）。 */
export function attachmentPreviewSrc(absPath: string): string {
  return `shy-file://a/${encodeURIComponent(absPath)}`
}
