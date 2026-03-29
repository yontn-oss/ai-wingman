import { describe, it, expect } from 'vitest'
import { stripJsonc } from '../../../src/utils/strip-jsonc.js'

describe('stripJsonc', () => {
  it('passes through plain JSON unchanged (except trailing comma removal)', () => {
    const input = '{"a": 1, "b": "hello"}'
    expect(JSON.parse(stripJsonc(input))).toEqual({ a: 1, b: 'hello' })
  })

  it('strips single-line comments', () => {
    const input = `{
      // top-level comment
      "key": "value" // inline comment
    }`
    expect(JSON.parse(stripJsonc(input))).toEqual({ key: 'value' })
  })

  it('strips block comments', () => {
    const input = `{
      /* block comment */
      "key": /* inline block */ "value"
    }`
    expect(JSON.parse(stripJsonc(input))).toEqual({ key: 'value' })
  })

  it('removes trailing commas', () => {
    const input = `{
      "a": 1,
      "b": [1, 2, 3,],
    }`
    expect(JSON.parse(stripJsonc(input))).toEqual({ a: 1, b: [1, 2, 3] })
  })

  it('preserves // inside string values (e.g. URLs)', () => {
    const input = '{"$schema": "https://json.schemastore.org/tsconfig"}'
    expect(JSON.parse(stripJsonc(input))).toEqual({
      $schema: 'https://json.schemastore.org/tsconfig',
    })
  })

  it('preserves escaped quotes inside strings', () => {
    const input = '{"msg": "say \\"hello\\" here"}'
    expect(JSON.parse(stripJsonc(input))).toEqual({ msg: 'say "hello" here' })
  })

  it('handles a realistic tsconfig with $schema and comments', () => {
    const input = `{
      "$schema": "https://json.schemastore.org/tsconfig",
      // strict mode
      "compilerOptions": {
        "strict": true, // always on
        "paths": {
          "@/*": ["./src/*"],
        },
      },
    }`
    const result = JSON.parse(stripJsonc(input))
    expect(result.$schema).toBe('https://json.schemastore.org/tsconfig')
    expect(result.compilerOptions.paths['@/*']).toEqual(['./src/*'])
  })
})
