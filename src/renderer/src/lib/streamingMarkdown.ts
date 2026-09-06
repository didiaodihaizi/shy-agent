/**
 * 流式 Markdown 展示用预处理：未完成时补闭合代码围栏，避免半截 ``` 花屏。
 * 不修改落库原文；仅影响渲染输入。
 */
export function prepareMarkdownForRender(content: string, complete: boolean): string {
  if (complete || !content) return content
  const lines = content.split('\n')
  let fenceOpen = false
  for (const line of lines) {
    if (/^\s*```/.test(line)) fenceOpen = !fenceOpen
  }
  if (!fenceOpen) return content
  return `${content}\n\`\`\``
}

/** 奇数个围栏行视为未闭合 */
export function hasUnclosedFence(content: string): boolean {
  let open = false
  for (const line of content.split('\n')) {
    if (/^\s*```/.test(line)) open = !open
  }
  return open
}
