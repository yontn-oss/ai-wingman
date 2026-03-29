import { describe, it, expect } from 'vitest'
import { generateMultiAgentOrchestratorRoute } from '../../../src/generators/multi-agent-orchestrator-route.js'
import { generateMultiAgentSpecialists } from '../../../src/generators/multi-agent-specialists.js'
import { generateMultiAgentHandoffTools } from '../../../src/generators/multi-agent-handoff-tools.js'
import { generateMultiAgentTypes } from '../../../src/generators/multi-agent-types.js'
import type { MultiAgentConfig } from '../../../src/types.js'
import { providers } from '../../../src/registry/providers.js'

const baseConfig: MultiAgentConfig = {
  auth: false,
  paths: {
    apiRoute: 'app/api/multi-agent/route.ts',
    specialists: 'lib/multi-agent/specialists.ts',
    handoffTools: 'lib/multi-agent/handoff-tools.ts',
    types: 'lib/multi-agent/types.ts',
  },
  pathOverwrites: {},
  provider: providers[1]!, // openai
  pathAlias: '@/',
  hasSrcDir: false,
  packageManager: 'npm',
  targetDir: '/tmp/test',
}

describe('generateMultiAgentOrchestratorRoute', () => {
  it('imports convertToModelMessages, stepCountIs, and streamText from ai', () => {
    const output = generateMultiAgentOrchestratorRoute(baseConfig)
    expect(output).toContain("import { convertToModelMessages, stepCountIs, streamText } from 'ai'")
  })

  it('imports the provider package', () => {
    const output = generateMultiAgentOrchestratorRoute(baseConfig)
    expect(output).toContain("import { openai } from '@ai-sdk/openai'")
  })

  it('imports handoffTools from the handoff tools file', () => {
    const output = generateMultiAgentOrchestratorRoute(baseConfig)
    expect(output).toContain("import { handoffTools } from '@/lib/multi-agent/handoff-tools'")
  })

  it('uses the provider model factory', () => {
    const output = generateMultiAgentOrchestratorRoute(baseConfig)
    expect(output).toContain(providers[1]!.modelFactory)
  })

  it('passes handoffTools and stopWhen to streamText', () => {
    const output = generateMultiAgentOrchestratorRoute(baseConfig)
    expect(output).toContain('tools: handoffTools,')
    expect(output).toContain('stopWhen: stepCountIs(10),')
  })

  it('calls toUIMessageStreamResponse', () => {
    const output = generateMultiAgentOrchestratorRoute(baseConfig)
    expect(output).toContain('result.toUIMessageStreamResponse()')
  })

  it('exports maxDuration = 60', () => {
    const output = generateMultiAgentOrchestratorRoute(baseConfig)
    expect(output).toContain('export const maxDuration = 60')
  })

  it('includes auth stub when auth is false', () => {
    const output = generateMultiAgentOrchestratorRoute(baseConfig)
    expect(output).toContain('TODO: bring your own auth')
  })

  it('includes auth guard when auth is true', () => {
    const output = generateMultiAgentOrchestratorRoute({ ...baseConfig, auth: true })
    expect(output).toContain("import { auth } from '@/auth'")
    expect(output).toContain('Unauthorized')
    expect(output).not.toContain('TODO: bring your own auth')
  })

  it('works with anthropic provider', () => {
    const output = generateMultiAgentOrchestratorRoute({ ...baseConfig, provider: providers[0]! })
    expect(output).toContain("import { anthropic } from '@ai-sdk/anthropic'")
    expect(output).toContain(providers[0]!.modelFactory)
  })

  it('snapshot', () => {
    expect(generateMultiAgentOrchestratorRoute(baseConfig)).toMatchSnapshot()
  })
})

describe('generateMultiAgentSpecialists', () => {
  it('imports generateText from ai', () => {
    const output = generateMultiAgentSpecialists(baseConfig)
    expect(output).toContain("import { generateText } from 'ai'")
  })

  it('imports the provider package', () => {
    const output = generateMultiAgentSpecialists(baseConfig)
    expect(output).toContain("import { openai } from '@ai-sdk/openai'")
  })

  it('imports HandoffPayload from the types file', () => {
    const output = generateMultiAgentSpecialists(baseConfig)
    expect(output).toContain("import type { HandoffPayload } from '@/lib/multi-agent/types'")
  })

  it('exports researchSpecialist and writerSpecialist', () => {
    const output = generateMultiAgentSpecialists(baseConfig)
    expect(output).toContain('export async function researchSpecialist(')
    expect(output).toContain('export async function writerSpecialist(')
  })

  it('uses the provider model factory in both specialists', () => {
    const output = generateMultiAgentSpecialists(baseConfig)
    expect(output.match(new RegExp(providers[1]!.modelFactory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))?.length).toBe(2)
  })

  it('returns text from generateText', () => {
    const output = generateMultiAgentSpecialists(baseConfig)
    expect(output).toContain('const { text } = await generateText(')
    expect(output).toContain('return text')
  })

  it('snapshot', () => {
    expect(generateMultiAgentSpecialists(baseConfig)).toMatchSnapshot()
  })
})

describe('generateMultiAgentHandoffTools', () => {
  it('imports tool from ai and z from zod', () => {
    const output = generateMultiAgentHandoffTools(baseConfig)
    expect(output).toContain("import { tool } from 'ai'")
    expect(output).toContain("import { z } from 'zod'")
  })

  it('imports specialists from the specialists file', () => {
    const output = generateMultiAgentHandoffTools(baseConfig)
    expect(output).toContain("import { researchSpecialist, writerSpecialist } from '@/lib/multi-agent/specialists'")
  })

  it('imports HandoffPayload type from the types file', () => {
    const output = generateMultiAgentHandoffTools(baseConfig)
    expect(output).toContain("import type { HandoffPayload } from '@/lib/multi-agent/types'")
  })

  it('exports handoffTools with callResearcher and callWriter', () => {
    const output = generateMultiAgentHandoffTools(baseConfig)
    expect(output).toContain('export const handoffTools = {')
    expect(output).toContain('callResearcher: tool({')
    expect(output).toContain('callWriter: tool({')
  })

  it('each tool has a description, parameters, and execute', () => {
    const output = generateMultiAgentHandoffTools(baseConfig)
    expect(output.match(/description:/g)?.length).toBe(2)
    expect(output.match(/parameters:/g)?.length).toBe(2)
    expect(output.match(/execute:/g)?.length).toBe(2)
  })

  it('tool parameters use z.object with task and optional context', () => {
    const output = generateMultiAgentHandoffTools(baseConfig)
    expect(output).toContain('z.string()')
    expect(output).toContain('z.string().optional()')
  })

  it('execute functions call the specialist with a HandoffPayload', () => {
    const output = generateMultiAgentHandoffTools(baseConfig)
    expect(output).toContain('const payload: HandoffPayload = args')
    expect(output).toContain('return researchSpecialist(payload)')
    expect(output).toContain('return writerSpecialist(payload)')
  })

  it('snapshot', () => {
    expect(generateMultiAgentHandoffTools(baseConfig)).toMatchSnapshot()
  })
})

describe('generateMultiAgentTypes', () => {
  it('exports HandoffPayload interface', () => {
    const output = generateMultiAgentTypes()
    expect(output).toContain('export interface HandoffPayload')
  })

  it('HandoffPayload has task: string and optional context', () => {
    const output = generateMultiAgentTypes()
    expect(output).toContain('task: string')
    expect(output).toContain('context?: string')
  })

  it('snapshot', () => {
    expect(generateMultiAgentTypes()).toMatchSnapshot()
  })
})
