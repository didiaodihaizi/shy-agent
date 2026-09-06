/**
 * ReActContent — 把 assistant content 以「普通展示」渲染（对齐 MiniMax / WorkBuddy）。
 *
 * - 推理收进可折叠「深度思考」
 * - 正文始终 Markdown；流式传 complete=false 做 fence 容错
 */
import { useMemo } from 'react'
import { MarkdownBody } from '../MarkdownBody'
import { splitAssistantContent } from '../../lib/splitAssistantContent'
import { stripXmlToolMarkup } from '../../../../shared/xml-tool-calls'

type Props = { content: string; skipThinking?: boolean; streaming?: boolean }

function splitReasoning(content: string): { reasoning: string; reply: string } {
  const { thinking, body } = splitAssistantContent(content)
  return { reasoning: thinking, reply: stripXmlToolMarkup(body) }
}

function countThinkBlocks(content: string): number {
  const closed = content.match(
    /<think\b[^>]*>[\s\S]*?<\/think>|<thinking\b[^>]*>[\s\S]*?<\/thinking>/gi
  )
  const n = closed?.length ?? 0
  const rest = content.replace(
    /<(?:think|thinking)\b[^>]*>[\s\S]*?<\/(?:think|thinking)>/gi,
    ''
  )
  if (/<(?:think|thinking)\b/i.test(rest)) return n + 1
  return n
}

export function ReActContent({ content, skipThinking = false, streaming = false }: Props): React.JSX.Element {
  const { reasoning, reply } = useMemo(() => splitReasoning(content), [content])
  const thinkCount = useMemo(() => countThinkBlocks(content), [content])
  const showThinking = Boolean(reasoning) && !skipThinking

  return (
    <div className="react-plain">
      {showThinking ? (
        <details className="react-thinking" open={streaming}>
          <summary className="react-thinking-head">
            <span className="think-chevron" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </span>
            深度思考{thinkCount > 1 ? ` · ${thinkCount}` : streaming ? '…' : ''}
          </summary>
          <div className="react-thinking-body react-thinking-pre">{reasoning}</div>
        </details>
      ) : null}
      {reply.trim() ? <MarkdownBody content={reply} complete={!streaming} /> : null}
    </div>
  )
}
