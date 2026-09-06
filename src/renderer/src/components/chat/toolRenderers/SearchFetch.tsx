import { ToolRowShell } from './ToolRowShell'
import type { ToolRendererProps } from './index'

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v)
      return p && typeof p === 'object' ? (p as Record<string, unknown>) : null
    } catch {
      return null
    }
  }
  return null
}

function faviconFor(url: string): string | null {
  try {
    const u = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=32`
  } catch {
    return null
  }
}

function hueFrom(text: string): string {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return `hsl(${h % 360} 45% 55%)`
}

/** 搜索结果：摘要行 + 浅灰合并盒 */
export function SearchToolRenderer(props: ToolRendererProps): React.JSX.Element {
  const out = asRecord(props.result)
  const results = Array.isArray(out?.results) ? (out.results as Array<Record<string, unknown>>) : []
  const resultError = String(out?.error ?? props.error ?? '')
  const done = props.status === 'done' || props.status === 'failed'

  return (
    <ToolRowShell
      {...props}
      error={resultError || props.error}
      failed={Boolean(resultError) || props.status === 'failed'}
      defaultOpen={done && results.length > 0}
    >
      {results.length ? (
        <div className="search-merge-box">
          {results.slice(0, 12).map((r, i) => {
            const title = String(r.title ?? r.url ?? '')
            const url = String(r.url ?? '')
            const fav = url ? faviconFor(url) : null
            return (
              <a
                key={i}
                className="search-merge-item"
                href={url || undefined}
                title={url}
                onClick={(e) => {
                  if (!url) e.preventDefault()
                }}
              >
                {fav ? (
                  <img className="search-merge-fav" src={fav} alt="" width={14} height={14} />
                ) : (
                  <span
                    className="search-merge-swatch"
                    style={{ background: hueFrom(title || String(i)) }}
                  />
                )}
                <span className="search-merge-title">{title || url || '结果'}</span>
              </a>
            )
          })}
        </div>
      ) : done ? (
        <div className="search-empty">未找到结果</div>
      ) : null}
    </ToolRowShell>
  )
}

export function WebFetchRenderer(props: ToolRendererProps): React.JSX.Element {
  const out = asRecord(props.result)
  const snippet = String(out?.snippet ?? out?.content ?? out?.text ?? '').slice(0, 400)
  const title = String(out?.title ?? '')
  return (
    <ToolRowShell {...props}>
      {title || snippet ? (
        <div className="search-merge-box">
          {title ? <div className="search-merge-title">{title}</div> : null}
          {snippet ? <div className="search-hit-snip">{snippet}</div> : null}
        </div>
      ) : null}
    </ToolRowShell>
  )
}
