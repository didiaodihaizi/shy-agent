/**
 * 时间轴工具行：图标 + 动作 + 灰字参数；点击展开详情。
 */
import { useState } from 'react'
import { getToolLabelParts } from '../../../lib/toolLabels'
import type { ToolRendererProps } from './index'
import { formatToolIo } from './formatToolIo'

type Props = ToolRendererProps & {
  children?: React.ReactNode
  extra?: React.ReactNode
  alwaysShowBody?: boolean
  /** 有结果时默认展开（如搜索合并盒） */
  defaultOpen?: boolean
  failed?: boolean
  /** 隐藏状态字，更接近 WorkBuddy 轻量行 */
  hideStatus?: boolean
}

function ToolGlyph({ name }: { name: string }): React.JSX.Element {
  const kind =
    name === 'web_search' || name === 'web_fetch' || name === 'browser_fetch'
      ? 'search'
      : name.startsWith('fs_') || name === 'read_me'
        ? 'file'
        : name === 'shell_exec'
          ? 'shell'
          : 'default'
  return <span className={`tool-glyph tool-glyph-${kind}`} aria-hidden="true" />
}

export function ToolRowShell({
  toolName,
  input,
  result,
  error,
  status = 'done',
  isLast = false,
  children,
  extra,
  alwaysShowBody = false,
  defaultOpen = false,
  failed: failedProp,
  hideStatus = true
}: Props): React.JSX.Element {
  const [open, setOpen] = useState(defaultOpen || alwaysShowBody)
  const running = status === 'running'
  const failed = failedProp ?? status === 'failed'
  const hasInput = input !== undefined && input !== null
  const hasResult = result !== undefined && result !== null && result !== ''
  const inputText = formatToolIo(input)
  const resultText = formatToolIo(result)
  const { action, param } = getToolLabelParts(toolName, input)
  const showMerge = Boolean(children) && !alwaysShowBody && open && !running
  const showLive = alwaysShowBody && Boolean(children)

  return (
    <div
      className={`tool-item${failed ? ' failed' : ''}${running ? ' running' : ''}${!running && !failed ? ' done' : ''}`}
    >
      <div className="tool-node" aria-hidden="true">
        <span className="tool-dot" />
        {!isLast ? <span className="tool-line" /> : null}
      </div>
      <button
        type="button"
        className="tool-row"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={open ? '收起详情' : '展开详情'}
      >
        <ToolGlyph name={toolName} />
        <span className="tool-row-main">
          <span className="tool-label">{action}</span>
          {param ? (
            <span className="tool-param" title={param}>
              {param}
            </span>
          ) : null}
        </span>
        {!hideStatus ? (
          <span className={`tool-status ${failed ? 'failed' : running ? 'running' : 'done'}`}>
            <span className="tool-status-dot" aria-hidden="true" />
            {failed ? '失败' : running ? '进行中…' : '已完成'}
          </span>
        ) : null}
      </button>
      {showLive ? <div className="tool-card tool-card-live">{children}</div> : null}
      {showMerge ? <div className="tool-merge-slot">{children}</div> : null}
      {open && !children ? (
        <div className="tool-card">
          <div className="tool-section">
            <span className="tool-section-label">输入</span>
            {hasInput ? <pre>{inputText}</pre> : <div className="search-empty">无参数</div>}
          </div>
          {running && !error ? (
            <div className="tool-section">
              <span className="tool-section-label">结果</span>
              <div className="search-empty">执行中…</div>
            </div>
          ) : error ? (
            <div className="tool-section">
              <span className="tool-section-label">错误</span>
              <pre className="tool-error">{error}</pre>
            </div>
          ) : (
            <div className="tool-section">
              <span className="tool-section-label">结果</span>
              {hasResult ? <pre>{resultText}</pre> : <div className="search-empty">无结果</div>}
              {extra}
            </div>
          )}
        </div>
      ) : null}
      {open && children && !showMerge && !showLive ? (
        <div className="tool-card">
          {error ? (
            <div className="tool-section">
              <span className="tool-section-label">错误</span>
              <pre className="tool-error">{error}</pre>
            </div>
          ) : (
            children
          )}
        </div>
      ) : null}
    </div>
  )
}
