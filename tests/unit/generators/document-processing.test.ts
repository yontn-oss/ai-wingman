import { describe, it, expect } from 'vitest'
import { generateDocumentProcessingRoute } from '../../../src/generators/document-processing-route.js'
import { generateDocumentProcessingSchema } from '../../../src/generators/document-processing-schema.js'
import { generateDocumentProcessingHook } from '../../../src/generators/document-processing-hook.js'
import type { DocumentProcessingConfig } from '../../../src/types.js'
import { providers } from '../../../src/registry/providers.js'

const baseConfig: DocumentProcessingConfig = {
  schemaName: 'document',
  auth: false,
  paths: {
    apiRoute: 'app/api/document-processing/route.ts',
    schema: 'lib/schemas/document.schema.ts',
    hook: 'hooks/use-document-extract.ts',
  },
  pathOverwrites: {},
  provider: providers[0]!, // anthropic
  pathAlias: '@/',
  targetDir: '/tmp/test',
}

describe('generateDocumentProcessingRoute', () => {
  it('imports generateText and Output from ai', () => {
    const output = generateDocumentProcessingRoute(baseConfig)
    expect(output).toContain("import { generateText, Output } from 'ai'")
  })

  it('imports the schema', () => {
    const output = generateDocumentProcessingRoute(baseConfig)
    expect(output).toContain("import { documentSchema } from '@/lib/schemas/document.schema'")
  })

  it('parses formData and reads file', () => {
    const output = generateDocumentProcessingRoute(baseConfig)
    expect(output).toContain('req.formData()')
    expect(output).toContain("form.get('file')")
  })

  it('converts file to base64', () => {
    const output = generateDocumentProcessingRoute(baseConfig)
    expect(output).toContain('arrayBuffer()')
    expect(output).toContain("toString('base64')")
  })

  it('sends file as a file message part', () => {
    const output = generateDocumentProcessingRoute(baseConfig)
    expect(output).toContain("type: 'file'")
    expect(output).toContain('data: base64')
    expect(output).toContain('mimeType')
  })

  it('uses Output.object with the schema', () => {
    const output = generateDocumentProcessingRoute(baseConfig)
    expect(output).toContain('Output.object({ schema: documentSchema })')
  })

  it('returns 400 when no file is provided', () => {
    const output = generateDocumentProcessingRoute(baseConfig)
    expect(output).toContain('No file provided')
    expect(output).toContain('status: 400')
  })

  it('includes auth stub when auth is false', () => {
    const output = generateDocumentProcessingRoute(baseConfig)
    expect(output).toContain('TODO: bring your own auth')
  })

  it('includes auth guard when auth is true', () => {
    const output = generateDocumentProcessingRoute({ ...baseConfig, auth: true })
    expect(output).toContain("import { auth } from '@/auth'")
    expect(output).toContain('Unauthorized')
  })

  it('snapshot — no auth', () => {
    expect(generateDocumentProcessingRoute(baseConfig)).toMatchSnapshot()
  })
})

describe('generateDocumentProcessingSchema', () => {
  it('exports a Zod schema with the configured name', () => {
    const output = generateDocumentProcessingSchema('document')
    expect(output).toContain('export const documentSchema = z.object(')
  })

  it('exports a TypeScript type', () => {
    const output = generateDocumentProcessingSchema('document')
    expect(output).toContain('export type Document = z.infer<typeof documentSchema>')
  })

  it('includes useful starter fields', () => {
    const output = generateDocumentProcessingSchema('document')
    expect(output).toContain('title')
    expect(output).toContain('summary')
    expect(output).toContain('keyPoints')
  })

  it('works with a custom schema name', () => {
    const output = generateDocumentProcessingSchema('invoice')
    expect(output).toContain('export const invoiceSchema')
    expect(output).toContain('export type Invoice =')
  })

  it('snapshot', () => {
    expect(generateDocumentProcessingSchema('document')).toMatchSnapshot()
  })
})

describe('generateDocumentProcessingHook', () => {
  it('exports a hook with the correct name', () => {
    const output = generateDocumentProcessingHook(baseConfig)
    expect(output).toContain('export function useDocumentExtract()')
  })

  it('imports the schema type', () => {
    const output = generateDocumentProcessingHook(baseConfig)
    expect(output).toContain("import type { Document } from '@/lib/schemas/document.schema'")
  })

  it('sends FormData with a file field', () => {
    const output = generateDocumentProcessingHook(baseConfig)
    expect(output).toContain('new FormData()')
    expect(output).toContain("form.append('file', file)")
  })

  it('calls the correct API path', () => {
    const output = generateDocumentProcessingHook(baseConfig)
    expect(output).toContain("'/api/document-processing'")
  })

  it('returns result, loading, error, extract', () => {
    const output = generateDocumentProcessingHook(baseConfig)
    expect(output).toContain('result, loading, error, extract')
  })

  it('snapshot', () => {
    expect(generateDocumentProcessingHook(baseConfig)).toMatchSnapshot()
  })
})
