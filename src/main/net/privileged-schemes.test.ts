import { describe, expect, it } from 'vitest'
import { PRIVILEGED_SCHEMES } from './privileged-schemes'

describe('PRIVILEGED_SCHEMES', () => {
  it('shy-material 允许媒体流式读取与跨源 fetch', () => {
    const material = PRIVILEGED_SCHEMES.find((s) => s.scheme === 'shy-material')
    expect(material?.privileges.supportFetchAPI).toBe(true)
    expect(material?.privileges.stream).toBe(true)
    expect(material?.privileges.corsEnabled).toBe(true)
  })

  it('shy-file 允许附件预览流式读取', () => {
    const file = PRIVILEGED_SCHEMES.find((s) => s.scheme === 'shy-file')
    expect(file?.privileges.supportFetchAPI).toBe(true)
    expect(file?.privileges.stream).toBe(true)
  })
})
