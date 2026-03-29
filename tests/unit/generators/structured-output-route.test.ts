import { describe, it, expect } from 'vitest'
import { generateStructuredOutputRoute } from '../../../src/generators/structured-output-route.js'
import { providers } from '../../../src/registry/providers.js'
import type { StructuredOutputConfig } from '../../../src/types.js'

const baseConfig: StructuredOutputConfig = {
  schemaName: 'output',
  auth: false,
  paths: {
    apiRoute: 'app/api/structured-output/route.ts',
    schema: 'lib/schemas/output.schema.ts',
    hook: 'hooks/use-output.ts',
  },
  pathOverwrites: {},
  provider: providers[0]!, // anthropic
  pathAlias: '~/',
  targetDir: '/tmp/test',
}

describe('generateStructuredOutputRoute', () => {
  it('generates route with generateObject and auth stub', () => {
    const output = generateStructuredOutputRoute(baseConfig)
    expect(output).toContain("import { generateText, Output } from 'ai'")
    expect(output).toContain("import { anthropic } from '@ai-sdk/anthropic'")
    expect(output).toContain("import { outputSchema } from '~/lib/schemas/output.schema'")
    expect(output).toContain('generateText(')
    expect(output).toContain('Output.object({ schema: outputSchema })')
    expect(output).toContain('Response.json(output)')
    expect(output).toContain('TODO: bring your own auth')
    expect(output).toMatchSnapshot()
  })

  it('includes auth guard when auth selected', () => {
    const config: StructuredOutputConfig = { ...baseConfig, auth: true }
    const output = generateStructuredOutputRoute(config)
    expect(output).toContain("import { auth } from '~/auth'")
    expect(output).toContain('Unauthorized')
    expect(output).not.toContain('TODO: bring your own auth')
    expect(output).toMatchSnapshot()
  })

  it('uses custom schema name', () => {
    const config: StructuredOutputConfig = {
      ...baseConfig,
      schemaName: 'filter',
      paths: { ...baseConfig.paths, schema: 'lib/schemas/filter.schema.ts' },
    }
    const output = generateStructuredOutputRoute(config)
    expect(output).toContain('filterSchema')
    expect(output).toContain("import { filterSchema } from '~/lib/schemas/filter.schema'")
    expect(output).toMatchSnapshot()
  })

  it('works with openai provider', () => {
    const config: StructuredOutputConfig = { ...baseConfig, provider: providers[1]! }
    const output = generateStructuredOutputRoute(config)
    expect(output).toContain("import { openai } from '@ai-sdk/openai'")
    expect(output).toMatchSnapshot()
  })

  it('strips src/ prefix from schema import path', () => {
    const config: StructuredOutputConfig = {
      ...baseConfig,
      paths: { ...baseConfig.paths, schema: 'src/lib/schemas/output.schema.ts' },
    }
    const output = generateStructuredOutputRoute(config)
    expect(output).toContain("'~/lib/schemas/output.schema'")
    expect(output).not.toContain('src/')
    expect(output).toMatchSnapshot()
  })
})
