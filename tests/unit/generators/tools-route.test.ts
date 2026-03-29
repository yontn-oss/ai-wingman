import { describe, it, expect } from 'vitest'
import { generateToolsRoute } from '../../../src/generators/tools-route.js'
import { generateToolsStub } from '../../../src/generators/tools-stub.js'
import type { ToolsConfig } from '../../../src/types.js'
import { providers } from '../../../src/registry/providers.js'

const baseConfig: ToolsConfig = {
  toolName: 'myTool',
  auth: false,
  paths: {
    apiRoute: 'app/api/tools/route.ts',
    toolsFile: 'lib/tools/my-tool.tools.ts',
  },
  pathOverwrites: {},
  provider: providers[0]!, // anthropic
  pathAlias: '@/',
  targetDir: '/tmp/test',
}

describe('generateToolsRoute', () => {
  it('imports streamText, stepCountIs and the tools variable', () => {
    const output = generateToolsRoute(baseConfig)
    expect(output).toContain("import { convertToModelMessages, stepCountIs, streamText } from 'ai'")
    expect(output).toContain('myToolTools')
    expect(output).toContain("from '@/lib/tools/my-tool.tools'")
  })

  it('calls streamText with tools and stopWhen: stepCountIs(5)', () => {
    const output = generateToolsRoute(baseConfig)
    expect(output).toContain('tools: myToolTools')
    expect(output).toContain('stopWhen: stepCountIs(5)')
  })

  it('returns toUIMessageStreamResponse (v6 format)', () => {
    const output = generateToolsRoute(baseConfig)
    expect(output).toContain('toUIMessageStreamResponse()')
    expect(output).not.toContain('toDataStreamResponse')
  })

  it('wraps streamText in try/catch returning 500 on failure', () => {
    const output = generateToolsRoute(baseConfig)
    expect(output).toContain('try {')
    expect(output).toContain('} catch {')
    expect(output).toContain('status: 500')
  })

  it('includes auth stub when auth is false', () => {
    const output = generateToolsRoute(baseConfig)
    expect(output).toContain('TODO: bring your own auth')
  })

  it('includes auth guard when auth is true', () => {
    const output = generateToolsRoute({ ...baseConfig, auth: true })
    expect(output).toContain("import { auth } from '@/auth'")
    expect(output).toContain('Unauthorized')
    expect(output).not.toContain('TODO: bring your own auth')
  })

  it('uses custom tool name', () => {
    const output = generateToolsRoute({ ...baseConfig, toolName: 'searchWeb' })
    expect(output).toContain('searchWebTools')
  })

  it('includes onStepFinish stub comment', () => {
    const output = generateToolsRoute(baseConfig)
    expect(output).toContain('onStepFinish')
  })

  it('snapshot — no auth', () => {
    expect(generateToolsRoute(baseConfig)).toMatchSnapshot()
  })
})

describe('generateToolsStub', () => {
  it('imports tool from ai and z from zod', () => {
    const output = generateToolsStub(baseConfig)
    expect(output).toContain("import { tool } from 'ai'")
    expect(output).toContain("import { z } from 'zod'")
  })

  it('exports a tools object keyed by toolName', () => {
    const output = generateToolsStub(baseConfig)
    expect(output).toContain('export const myToolTools')
    expect(output).toContain('myTool: tool({')
  })

  it('includes TODO description and execute stub', () => {
    const output = generateToolsStub(baseConfig)
    expect(output).toContain('TODO')
    expect(output).toContain('async execute')
    expect(output).toContain('not implemented')
  })

  it('uses custom tool name', () => {
    const output = generateToolsStub({ ...baseConfig, toolName: 'searchWeb' })
    expect(output).toContain('export const searchWebTools')
    expect(output).toContain('searchWeb: tool({')
  })

  it('snapshot — default myTool', () => {
    expect(generateToolsStub(baseConfig)).toMatchSnapshot()
  })

  it('snapshot — custom searchWeb', () => {
    expect(generateToolsStub({ ...baseConfig, toolName: 'searchWeb' })).toMatchSnapshot()
  })
})
