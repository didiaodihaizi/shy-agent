type Props = {
  content: string
  durationMs?: number
  streaming?: boolean
}

function formatDuration(ms?: number): string {
  if (ms === undefined || Number.isNaN(ms)) return ''
  const sec = Math.max(1, Math.round(ms / 1000))
  return `${sec} 秒`
}

/** 深度思考穿插行（对齐 WorkBuddy） */
export function ReasoningBlock({ content, durationMs, streaming }: Props): React.JSX.Element {
  const time = formatDuration(durationMs)
  return (
    <details className="react-thinking reasoning-block deep-think" open={Boolean(streaming)}>
      <summary className="react-thinking-head">
        <span className="think-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
        深度思考{time ? ` · ${time}` : streaming ? '…' : ''}
      </summary>
      <div className="react-thinking-body react-thinking-pre">{content || '…'}</div>
    </details>
  )
}
