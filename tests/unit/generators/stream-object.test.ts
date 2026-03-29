import { describe, it, expect } from 'vitest'
import { generateStreamObjectRoute } from '../../../src/generators/stream-object-route.js'
import { generateStreamObjectHook } from '../../../src/generators/stream-object-hook.js'
import type { StreamObjectConfig } from '../../../src/types.js'
import { providers } from '../../../src/registry/providers.js'

const baseConfig: StreamObjectConfig = {
  schemaName: 'output',
  auth: false,
  paths: {
    apiRoute: 'app/api/stream-object/route.ts',
    schema: 'lib/schemas/output.schema.ts',
    hook: 'hooks/use-output-stream.ts',
  },
  pathOverwrites: {},
  schemaAlreadyExists: false,
  provider: providers[0]!, // anthropic
  pathAlias: '@/',
  targetDir: '/tmp/test',
}

describe('generateStreamObjectRoute', () => {
  it('imports streamObject (not generateText or Output)', () => {
    const output = generateStreamObjectRoute(baseConfig)
    expect(output).toContain("import { streamObject } from 'ai'")
    expect(output).not.toContain('generateText')
    expect(output).not.toContain('Output')
  })

  it('returns toTextStreamResponse (not toDataStreamResponse)', () => {
    const output = generateStreamObjectRoute(baseConfig)
    expect(output).toContain('toTextStreamResponse()')
    expect(output).not.toContain('toDataStreamResponse')
  })

  it('reads { prompt } from request body (single string, not messages array)', () => {
    const output = generateStreamObjectRoute(baseConfig)
    expect(output).toContain('const { prompt }')
    expect(output).not.toContain('const { messages')
  })

  it('imports and uses the schema', () => {
    const output = generateStreamObjectRoute(baseConfig)
    expect(output).toContain('outputSchema')
    expect(output).toContain("from '@/lib/schemas/output.schema'")
    expect(output).toContain('schema: outputSchema')
  })

  it('includes auth stub when auth is false', () => {
    expect(generateStreamObjectRoute(baseConfig)).toContain('TODO: bring your own auth')
  })

  it('includes auth guard when auth is true', () => {
    const output = generateStreamObjectRoute({ ...baseConfig, auth: true })
    expect(output).toContain("import { auth } from '@/auth'")
    expect(output).toContain('Unauthorized')
    expect(output).toMatchSnapshot()
  })

  it('uses custom schema name', () => {
    const output = generateStreamObjectRoute({ ...baseConfig, schemaName: 'product' })
    expect(output).toContain('productSchema')
  })

  it('snapshot — default output', () => {
    expect(generateStreamObjectRoute(baseConfig)).toMatchSnapshot()
  })
})

describe('generateStreamObjectHook', () => {
  it('imports useObject from @ai-sdk/react', () => {
    const output = generateStreamObjectHook(baseConfig)
    expect(output).toContain("import { experimental_useObject as useObject } from '@ai-sdk/react'")
  })

  it('does not import useChat', () => {
    const output = generateStreamObjectHook(baseConfig)
    expect(output).not.toContain('useChat')
  })

  it('imports the schema value (runtime, not just type)', () => {
    const output = generateStreamObjectHook(baseConfig)
    expect(output).toContain('outputSchema')
    expect(output).not.toMatch(/import type.*outputSchema/)
  })

  it('exports hook named use{TypeName}Stream', () => {
    const output = generateStreamObjectHook(baseConfig)
    expect(output).toContain('export function useOutputStream(')
  })

  it('exposes submit function wrapping submitObject', () => {
    const output = generateStreamObjectHook(baseConfig)
    expect(output).toContain('submit(prompt: string)')
    expect(output).toContain('submitObject')
  })

  it('returns object, isLoading, error, submit', () => {
    const output = generateStreamObjectHook(baseConfig)
    expect(output).toContain('object')
    expect(output).toContain('isLoading')
    expect(output).toContain('error')
    expect(output).toContain('submit')
  })

  it('uses custom schema name', () => {
    const config: StreamObjectConfig = {
      ...baseConfig,
      schemaName: 'product',
      paths: { ...baseConfig.paths, hook: 'hooks/use-product-stream.ts' },
    }
    const output = generateStreamObjectHook(config)
    expect(output).toContain('export function useProductStream(')
    expect(output).toContain('productSchema')
  })

  it('snapshot — default output', () => {
    expect(generateStreamObjectHook(baseConfig)).toMatchSnapshot()
  })

  it('snapshot — product', () => {
    const config: StreamObjectConfig = {
      ...baseConfig,
      schemaName: 'product',
      paths: { ...baseConfig.paths, hook: 'hooks/use-product-stream.ts' },
    }
    expect(generateStreamObjectHook(config)).toMatchSnapshot()
  })
})
