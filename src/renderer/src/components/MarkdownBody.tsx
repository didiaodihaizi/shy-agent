import { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { httpUrlFromMarkdownHref } from '../lib/markdownLink'
import { useOpenInBrowser } from '../lib/openInBrowser'
import { prepareMarkdownForRender } from '../lib/streamingMarkdown'

type Props = {
  content: string
  /** false=流式中，对未闭合 fence 做展示容错；默认 true */
  complete?: boolean
}

export const MarkdownBody = memo(function MarkdownBody({
  content,
  complete = true
}: Props): React.JSX.Element {
  const openInBrowser = useOpenInBrowser()
  const renderContent = useMemo(
    () => prepareMarkdownForRender(content, complete),
    [content, complete]
  )
  if (!content.trim()) return <></>
  return (
    <div className={`md${complete ? '' : ' md-streaming'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children, node: _node, ...rest }) {
            return (
              <a
                {...rest}
                href={href}
                onClick={(e) => {
                  e.preventDefault()
                  const url = httpUrlFromMarkdownHref(href)
                  if (url) openInBrowser(url)
                }}
              >
                {children}
              </a>
            )
          }
        }}
      >
        {renderContent}
      </ReactMarkdown>
    </div>
  )
})
