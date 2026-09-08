import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { mkdtemp, rm, readFile, mkdir, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { tmpdir } from 'os'
import { join, isAbsolute } from 'path'
import {
  assertWritableHtmlContent,
  registerBuiltinTools,
  resolveWorkspacePath
} from './builtin'
import { buildTools } from './registry'

vi.mock('../../memory/db', () => ({
  recordFileOp: () => undefined,
  upsertLongMemory: () => undefined,
  deleteLongMemory: () => undefined,
  listLongMemory: () => []
}))

const getSettingsMock = vi.fn(async () => ({
  apiKey: '',
  baseURL: '',
  model: '',
  provider: 'openai' as const,
  autoApproveTools: false
}))

vi.mock('../../settings/store', () => ({
  getSettings: () => getSettingsMock(),
  setSettings: vi.fn()
}))

let ws: string
let ctx: Parameters<typeof buildTools>[0]

beforeEach(async () => {
  ws = await mkdtemp(join(tmpdir(), 'shy-ws-'))
  getSettingsMock.mockResolvedValue({
    apiKey: '',
    baseURL: '',
    model: '',
    provider: 'openai',
    autoApproveTools: false
  })
  ctx = {
    emit: () => undefined,
    confirmHighRisk: async () => true,
    sessionId: 'ses-ws-test',
    workspaceDir: ws
  }
})

afterAll(async () => {
  await rm(ws, { recursive: true, force: true })
})

describe('resolveWorkspacePath', () => {
  it('相对路径解析到工作区，绝对路径原样', () => {
    expect(resolveWorkspacePath('/ws', 'a/b.md')).toBe('/ws/a/b.md')
    expect(resolveWorkspacePath('/ws', '/etc/hosts')).toBe('/etc/hosts')
    expect(isAbsolute(resolveWorkspacePath('/ws', './x'))).toBe(true)
  })
})

describe('assertWritableHtmlContent', () => {
  it('完整 HTML 文档通过', () => {
    expect(
      assertWritableHtmlContent(
        'a.html',
        '<!DOCTYPE html><html><body>x</body></html>'
      )
    ).toBeNull()
  })

  it('含 html 开标签但无 </html> 视为截断', () => {
    const err = assertWritableHtmlContent(
      'a.html',
      '<!DOCTYPE html><html><body><pre>function foo() {'
    )
    expect(err).toMatch(/截断|<\/html>/)
  })

  it('片段 HTML（无 doctype/html 根）不强制闭合', () => {
    expect(assertWritableHtmlContent('a.html', '<p>x</p>')).toBeNull()
  })

  it('非 html 扩展名不检查', () => {
    expect(assertWritableHtmlContent('a.md', '<html>no close')).toBeNull()
  })
})

describe('fs_write / fs_read 会话工作区', () => {
  it('fs_write 拒绝不完整的 HTML 文档且不落盘', async () => {
    registerBuiltinTools()
    const tools = buildTools(ctx)
    const fsWrite = tools.find((t) => t.name === 'fs_write')!
    const path = 'broken.html'
    const res = JSON.parse(
      await fsWrite.run({
        path,
        content: '<!DOCTYPE html>\n<html lang="zh-CN"><body><h1>半截'
      })
    )
    expect(res.ok).toBe(false)
    expect(String(res.error)).toMatch(/截断|<\/html>/)
    expect(existsSync(join(ws, path))).toBe(false)
  })

  it('fs_write 相对路径落在 workspace 下', async () => {
    registerBuiltinTools()
    const tools = buildTools(ctx)
    const fsWrite = tools.find((t) => t.name === 'fs_write')!
    const res = JSON.parse(await fsWrite.run({ path: 'reports/note.md', content: '# hi' }))
    expect(res.ok).toBe(true)
    expect(res.path).toBe(join(ws, 'reports', 'note.md'))
    expect(existsSync(join(ws, 'reports', 'note.md'))).toBe(true)
    expect(await readFile(join(ws, 'reports', 'note.md'), 'utf8')).toBe('# hi')
  })

  it('fs_read 相对路径从 workspace 读', async () => {
    await mkdir(ws, { recursive: true })
    await writeFile(join(ws, 'data.txt'), '内容', 'utf8')
    const tools = buildTools(ctx)
    const fsRead = tools.find((t) => t.name === 'fs_read')!
    const res = JSON.parse(await fsRead.run({ path: 'data.txt' }))
    expect(res.ok).toBe(true)
    expect(res.content).toBe('内容')
  })

  it('默认权限拒绝越界绝对路径', async () => {
    registerBuiltinTools()
    const tools = buildTools(ctx)
    const fsRead = tools.find((t) => t.name === 'fs_read')!
    const res = JSON.parse(await fsRead.run({ path: '/etc/hosts' }))
    expect(res.ok).toBe(false)
    expect(String(res.error)).toMatch(/越界/)
  })

  it('完全访问不报越界（文件不存在则抛 IO 错）', async () => {
    getSettingsMock.mockResolvedValue({
      apiKey: '',
      baseURL: '',
      model: '',
      provider: 'openai',
      autoApproveTools: true
    })
    registerBuiltinTools()
    const tools = buildTools(ctx)
    const fsRead = tools.find((t) => t.name === 'fs_read')!
    await expect(fsRead.run({ path: join(tmpdir(), 'shy-no-such-fence-file') })).rejects.toThrow()
  })
})
