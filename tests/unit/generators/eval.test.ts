import { describe, it, expect } from 'vitest'
import { generateEvalScript } from '../../../src/generators/eval-script.js'
import type { EvalConfig } from '../../../src/types.js'
import { providers } from '../../../src/registry/providers.js'

const baseConfig: EvalConfig = {
  paths: { evalScript: 'evals/my-eval.ts' },
  pathOverwrites: {},
  provider: providers[0]!, // anthropic
  pathAlias: '@/',
  targetDir: '/tmp/test',
}

describe('generateEvalScript', () => {
  it('imports generateText from ai', () => {
    const output = generateEvalScript(baseConfig)
    expect(output).toContain("import { generateText } from 'ai'")
  })

  it('imports the configured provider', () => {
    const output = generateEvalScript(baseConfig)
    expect(output).toContain("import { anthropic } from '@ai-sdk/anthropic'")
  })

  it('defines EvalCase interface with name, systemPrompt, userPrompt, score', () => {
    const output = generateEvalScript(baseConfig)
    expect(output).toContain('interface EvalCase')
    expect(output).toContain('systemPrompt')
    expect(output).toContain('userPrompt')
    expect(output).toContain('score(output: string)')
  })

  it('includes a runEvals function that iterates evalCases', () => {
    const output = generateEvalScript(baseConfig)
    expect(output).toContain('async function runEvals()')
    expect(output).toContain('for (const c of evalCases)')
  })

  it('exits with code 1 on failures', () => {
    const output = generateEvalScript(baseConfig)
    expect(output).toContain('process.exit(1)')
  })

  it('reports average score', () => {
    const output = generateEvalScript(baseConfig)
    expect(output).toContain('Average score')
  })

  it('includes run instructions as a comment', () => {
    const output = generateEvalScript(baseConfig)
    expect(output).toContain('npx tsx')
    expect(output).toContain(baseConfig.paths.evalScript)
  })

  it('snapshot', () => {
    expect(generateEvalScript(baseConfig)).toMatchSnapshot()
  })
})
