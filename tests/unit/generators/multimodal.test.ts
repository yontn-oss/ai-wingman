import { describe, it, expect } from 'vitest'
import { generateMultimodalRoute } from '../../../src/generators/multimodal-route.js'
import { generateMultimodalPage } from '../../../src/generators/multimodal-page.js'
import type { MultimodalConfig } from '../../../src/types.js'
import { providers } from '../../../src/registry/providers.js'

const baseConfig: MultimodalConfig = {
  auth: false,
  includePage: true,
  paths: {
    apiRoute: 'app/api/multimodal/route.ts',
    page: 'app/multimodal/page.tsx',
  },
  pathOverwrites: {},
  provider: providers[0]!, // anthropic
  pathAlias: '@/',
  hasSrcDir: false,
  packageManager: 'pnpm',
  targetDir: '/tmp/test',
}

describe('generateMultimodalRoute', () => {
  it('imports convertToModelMessages and streamText from ai', () => {
    const output = generateMultimodalRoute(baseConfig)
    expect(output).toContain("import { convertToModelMessages, streamText } from 'ai'")
  })

  it('calls streamText and returns toUIMessageStreamResponse', () => {
    const output = generateMultimodalRoute(baseConfig)
    expect(output).toContain('streamText({')
    expect(output).toContain('toUIMessageStreamResponse()')
  })

  it('includes auth stub when auth is false', () => {
    const output = generateMultimodalRoute(baseConfig)
    expect(output).toContain('TODO: bring your own auth')
  })

  it('includes auth guard when auth is true', () => {
    const output = generateMultimodalRoute({ ...baseConfig, auth: true })
    expect(output).toContain("import { auth } from '@/auth'")
    expect(output).toContain('Unauthorized')
    expect(output).not.toContain('TODO: bring your own auth')
  })

  it('includes a doc comment about image parts', () => {
    const output = generateMultimodalRoute(baseConfig)
    expect(output).toContain('image parts')
  })

  it('snapshot — no auth', () => {
    expect(generateMultimodalRoute(baseConfig)).toMatchSnapshot()
  })
})

describe('generateMultimodalPage', () => {
  it('converts files to FileUIParts', () => {
    const output = generateMultimodalPage(baseConfig)
    expect(output).toContain('fileToUIPart')
    expect(output).toContain('FileReader')
    expect(output).toContain('readAsDataURL')
  })

  it('tracks pending files in state', () => {
    const output = generateMultimodalPage(baseConfig)
    expect(output).toContain('pendingFiles')
    expect(output).toContain('setPendingFiles')
  })

  it('uses file input for image attachment', () => {
    const output = generateMultimodalPage(baseConfig)
    expect(output).toContain('type="file"')
    expect(output).toContain('accept="image/*"')
  })

  it('uses the correct api path', () => {
    const output = generateMultimodalPage(baseConfig)
    expect(output).toContain("const API_PATH = '/api/multimodal'")
  })

  it('imports ai-elements components', () => {
    const output = generateMultimodalPage(baseConfig)
    expect(output).toContain('ai-elements/conversation')
    expect(output).toContain('ai-elements/prompt-input')
  })

  it('snapshot', () => {
    expect(generateMultimodalPage(baseConfig)).toMatchSnapshot()
  })
})
