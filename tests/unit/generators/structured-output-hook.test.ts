import { describe, it, expect } from 'vitest'
import { generateStructuredOutputHook } from '../../../src/generators/structured-output-hook.js'
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
  provider: providers[0]!,
  pathAlias: '~/',
  targetDir: '/tmp/test',
}

describe('generateStructuredOutputHook', () => {
  it('generates hook with correct type and fetch url', () => {
    const output = generateStructuredOutputHook(baseConfig)
    expect(output).toContain("import type { Output } from '~/lib/schemas/output.schema'")
    expect(output).toContain('export function useOutput()')
    expect(output).toContain("useState<Output | null>(null)")
    expect(output).toContain("fetch('/api/structured-output'")
    expect(output).toContain('result, loading, error, generate')
    expect(output).toMatchSnapshot()
  })

  it('uses custom schema name for hook and type', () => {
    const config: StructuredOutputConfig = {
      ...baseConfig,
      schemaName: 'filter',
      paths: {
        apiRoute: 'app/api/filter/route.ts',
        schema: 'lib/schemas/filter.schema.ts',
        hook: 'hooks/use-filter.ts',
      },
    }
    const output = generateStructuredOutputHook(config)
    expect(output).toContain('export function useFilter()')
    expect(output).toContain("import type { Filter } from '~/lib/schemas/filter.schema'")
    expect(output).toContain("fetch('/api/filter'")
    expect(output).toMatchSnapshot()
  })

  it('strips src/ prefix from schema import and api url', () => {
    const config: StructuredOutputConfig = {
      ...baseConfig,
      paths: {
        apiRoute: 'src/app/api/structured-output/route.ts',
        schema: 'src/lib/schemas/output.schema.ts',
        hook: 'src/hooks/use-output.ts',
      },
    }
    const output = generateStructuredOutputHook(config)
    expect(output).toContain("'~/lib/schemas/output.schema'")
    expect(output).toContain("fetch('/api/structured-output'")
    expect(output).not.toContain('src/')
    expect(output).toMatchSnapshot()
  })
})
