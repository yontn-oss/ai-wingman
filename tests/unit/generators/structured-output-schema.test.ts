import { describe, it, expect } from 'vitest'
import { generateStructuredOutputSchema } from '../../../src/generators/structured-output-schema.js'

describe('generateStructuredOutputSchema', () => {
  it('generates schema with default name', () => {
    const output = generateStructuredOutputSchema('output')
    expect(output).toContain("import { z } from 'zod'")
    expect(output).toContain('export const outputSchema = z.object({')
    expect(output).toContain('export type Output = z.infer<typeof outputSchema>')
    expect(output).toContain('TODO: define your schema')
    expect(output).toMatchSnapshot()
  })

  it('uses custom schema name', () => {
    const output = generateStructuredOutputSchema('filter')
    expect(output).toContain('export const filterSchema = z.object({')
    expect(output).toContain('export type Filter = z.infer<typeof filterSchema>')
    expect(output).toMatchSnapshot()
  })

  it('capitalises first letter of type name', () => {
    const output = generateStructuredOutputSchema('searchResult')
    expect(output).toContain('export const searchResultSchema')
    expect(output).toContain('export type SearchResult =')
    expect(output).toMatchSnapshot()
  })
})
