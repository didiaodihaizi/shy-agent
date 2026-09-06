import { ReActContent } from './ReActContent'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { ReasoningBlock } from './ReasoningBlock'
import { getToolRenderer, registerToolRenderer } from './toolRenderers'
import { SearchToolRenderer, WebFetchRenderer } from './toolRenderers/SearchFetch'
import {
  EditFileRenderer,
  ExecuteCommandRenderer,
  GlobRenderer,
  GrepRenderer,
  ListDirRenderer,
  ReadFileRenderer,
  WriteFileRenderer
} from './toolRenderers/FsShell'
import {
  ArtifactRenderer,
  AskUserRenderer,
  ReadLintsRenderer,
  ReadMeRenderer,
  TaskToolRenderer,
  WidgetRenderer
} from './toolRenderers/Visual'
import type { TurnSegment } from './turnSegments'
import { hasReasoning } from './turnSegments'

let registered = false
function ensureRenderers(): void {
  if (registered) return
  registered = true
  registerToolRenderer('web_search', SearchToolRenderer)
  registerToolRenderer('web_fetch', WebFetchRenderer)
  registerToolRenderer('browser_fetch', WebFetchRenderer)
  registerToolRenderer('grep', GrepRenderer)
  registerToolRenderer('glob', GlobRenderer)
  registerToolRenderer('fs_list', ListDirRenderer)
  registerToolRenderer('fs_edit', EditFileRenderer)
  registerToolRenderer('fs_read', ReadFileRenderer)
  registerToolRenderer('fs_write', WriteFileRenderer)
  registerToolRenderer('shell_exec', ExecuteCommandRenderer)
  registerToolRenderer('read_me', ReadMeRenderer)
  registerToolRenderer('show_widget', WidgetRenderer)
  registerToolRenderer('present_artifact', ArtifactRenderer)
  registerToolRenderer('ask_user', AskUserRenderer)
  registerToolRenderer('read_lints', ReadLintsRenderer)
  registerToolRenderer('task', TaskToolRenderer)
  registerToolRenderer('task_query', TaskToolRenderer)
  registerToolRenderer('task_output', TaskToolRenderer)
  registerToolRenderer('task_stop', TaskToolRenderer)
}

function formatElapsed(ms: number): string {
  const totalSec = Math.max(1, Math.round(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m <= 0) return `${s}s`
  return `${m}m${String(s).padStart(2, '0')}s`
}

type Props = {
  segments: TurnSegment[]
  streaming?: boolean
  /** 本轮开始墙钟；用于完成耗时 */
  startedAt?: number
  /** 本轮结束墙钟（历史消息用 createdAt） */
  endedAt?: number
}

export const AgentTimeline = memo(function AgentTimeline({
  segments,
  streaming,
  startedAt,
  endedAt
}: Props): React.JSX.Element {
  ensureRenderers()
  const skipThinking = hasReasoning(segments)
  const lastIdx = segments.length - 1
  const [finishedAt, setFinishedAt] = useState<number | null>(null)
  const wasStreaming = useRef(Boolean(streaming))

  useEffect(() => {
    if (streaming) {
      wasStreaming.current = true
      setFinishedAt(null)
      return
    }
    if (wasStreaming.current && finishedAt == null && segments.length > 0) {
      setFinishedAt(Date.now())
    }
  }, [streaming, segments.length, finishedAt])

  const elapsedLabel = useMemo(() => {
    if (streaming || !startedAt) return null
    const end = finishedAt ?? endedAt
    if (end == null || end < startedAt) return null
    return formatElapsed(end - startedAt)
  }, [streaming, startedAt, endedAt, finishedAt])

  const allToolsSettled = segments.every(
    (s) => s.kind !== 'tool' || s.status === 'done' || s.status === 'failed'
  )
  const showFooter = !streaming && allToolsSettled && segments.length > 0

  return (
    <div className="tool-timeline agent-timeline">
      {showFooter && elapsedLabel ? (
        <div className="timeline-footer-status">
          已完成<span className="timeline-footer-sep">·</span>
          {elapsedLabel}
        </div>
      ) : null}
      {segments.map((seg, i) => {
        const isLast = i === lastIdx
        if (seg.kind === 'reasoning') {
          return (
            <ReasoningBlock
              key={seg.id}
              content={seg.content}
              durationMs={seg.durationMs}
              streaming={!seg.done && streaming}
            />
          )
        }
        if (seg.kind === 'tool') {
          const Renderer = getToolRenderer(seg.toolName)
          return (
            <Renderer
              key={seg.id}
              toolName={seg.toolName}
              input={seg.input}
              result={seg.result}
              error={seg.error}
              status={seg.status}
              isLast={isLast}
            />
          )
        }
        return (
          <div key={seg.id} className="timeline-text">
            <ReActContent content={seg.content} skipThinking={skipThinking} streaming={isLast && streaming} />
          </div>
        )
      })}
    </div>
  )
})
