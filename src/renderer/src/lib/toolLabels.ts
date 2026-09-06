/**
 * 工具人话标签。未知名 fallback 为 raw 工具名。
 */
function asRecord(input: unknown): Record<string, unknown> | null {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    return input as Record<string, unknown>
  }
  if (typeof input === 'string') {
    try {
      const v = JSON.parse(input)
      return v && typeof v === 'object' ? (v as Record<string, unknown>) : null
    } catch {
      return null
    }
  }
  return null
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url.slice(0, 40)
  }
}

export type ToolLabelParts = { action: string; param?: string }

/** 拆成动作名 + 次要参数（时间轴灰字） */
export function getToolLabelParts(name: string, input?: unknown): ToolLabelParts {
  const args = asRecord(input)
  switch (name) {
    case 'web_search': {
      const q = str(args?.query)
      return q ? { action: '网页搜索', param: q } : { action: '网页搜索' }
    }
    case 'web_fetch':
    case 'browser_fetch': {
      const url = str(args?.url)
      return url ? { action: '抓取网页', param: hostOf(url) } : { action: '抓取网页' }
    }
    case 'browser_open':
      return { action: '打开浏览器' }
    case 'browser':
      return args?.action
        ? { action: 'browser', param: str(args.action) }
        : { action: 'browser' }
    case 'grep': {
      const p = str(args?.pattern)
      return p ? { action: '搜索代码', param: p } : { action: '搜索代码' }
    }
    case 'glob': {
      const p = str(args?.pattern)
      return p ? { action: '查找文件', param: p } : { action: '查找文件' }
    }
    case 'fs_list': {
      const p = str(args?.path)
      return p ? { action: '列出目录', param: p } : { action: '列出目录' }
    }
    case 'fs_read': {
      const p = str(args?.path)
      return p ? { action: '读取文件', param: p } : { action: '读取文件' }
    }
    case 'fs_write': {
      const p = str(args?.path)
      return p ? { action: '写入文件', param: p } : { action: '写入文件' }
    }
    case 'fs_edit': {
      const p = str(args?.path)
      return p ? { action: '编辑文件', param: p } : { action: '编辑文件' }
    }
    case 'fs_delete': {
      const p = str(args?.path)
      return p ? { action: '删除文件', param: p } : { action: '删除文件' }
    }
    case 'shell_exec': {
      const c = str(args?.command).slice(0, 48)
      return c ? { action: '执行命令', param: c } : { action: '执行命令' }
    }
    case 'read_me': {
      const m = str(args?.module)
      return m ? { action: '读取指南', param: m } : { action: '读取指南' }
    }
    case 'show_widget': {
      const t = str(args?.widgetType)
      return t ? { action: '可视化', param: t } : { action: '可视化' }
    }
    case 'present_artifact': {
      const paths = args?.paths
      const n = Array.isArray(paths) ? paths.length : args?.url ? 1 : 0
      return n ? { action: '呈现产物', param: `${n} 项` } : { action: '呈现产物' }
    }
    case 'ask_user': {
      const q = str(args?.question).slice(0, 32)
      return q ? { action: '询问用户', param: q } : { action: '询问用户' }
    }
    case 'read_lints':
      return { action: '读取诊断' }
    case 'task':
    case 'task_query':
    case 'task_output':
    case 'task_stop':
      return { action: '任务' }
    case 'dispatch_subagent':
      return args?.type
        ? { action: 'dispatch_subagent', param: str(args.type) }
        : { action: 'dispatch_subagent' }
    case 'image_gen':
      return { action: '生成图像' }
    default:
      return { action: name }
  }
}

export function getToolLabel(name: string, input?: unknown): string {
  const { action, param } = getToolLabelParts(name, input)
  return param ? `${action} · ${param}` : action
}
