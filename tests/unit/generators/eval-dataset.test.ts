import { describe, it, expect } from 'vitest'
import { generateEvalDatasetJsonl } from '../../../src/generators/eval-dataset-jsonl.js'
import { generateEvalDatasetRunner } from '../../../src/generators/eval-dataset-runner.js'
import { generateEvalDatasetWorkflow } from '../../../src/generators/eval-dataset-workflow.js'
import type { EvalConfig } from '../../../src/types.js'
import { providers } from '../../../src/registry/providers.js'

const baseConfig: EvalConfig = {
  useDataset: true,
  includeWorkflow: true,
  paths: {
    dataset: 'evals/dataset.jsonl',
    runner: 'evals/dataset-runner.ts',
    workflow: '.github/workflows/eval.yml',
    datasetRelativeFromRunner: 'dataset.jsonl',
  },
  pathOverwrites: {},
  provider: providers[1]!, // openai
  pathAlias: '@/',
  targetDir: '/tmp/test',
}


describe('generateEvalDatasetJsonl', () => {
  it('produces valid JSONL — every line parses as JSON', () => {
    const output = generateEvalDatasetJsonl()
    const lines = output.trim().split('\n')
    expect(lines.length).toBeGreaterThan(0)
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow()
    }
  })

  it('each record has input and expectedOutput fields', () => {
    const output = generateEvalDatasetJsonl()
    const records = output.trim().split('\n').map((l) => JSON.parse(l))
    for (const r of records) {
      expect(typeof r.input).toBe('string')
      expect(typeof r.expectedOutput).toBe('string')
    }
  })

  it('ships at least 3 seed records', () => {
    const output = generateEvalDatasetJsonl()
    const records = output.trim().split('\n')
    expect(records.length).toBeGreaterThanOrEqual(3)
  })

  it('snapshot', () => {
    expect(generateEvalDatasetJsonl()).toMatchSnapshot()
  })
})

describe('generateEvalDatasetRunner', () => {
  it('imports generateText from ai', () => {
    const output = generateEvalDatasetRunner(baseConfig)
    expect(output).toContain("import { generateText } from 'ai'")
  })

  it('imports the provider package', () => {
    const output = generateEvalDatasetRunner(baseConfig)
    expect(output).toContain("import { openai } from '@ai-sdk/openai'")
  })

  it('uses the provider model factory for MODEL and JUDGE_MODEL', () => {
    const output = generateEvalDatasetRunner(baseConfig)
    expect(output.match(new RegExp(providers[1]!.modelFactory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))?.length).toBeGreaterThanOrEqual(2)
  })

  it('loads dataset from the relative path', () => {
    const output = generateEvalDatasetRunner(baseConfig)
    expect(output).toContain('dataset.jsonl')
    expect(output).toContain('import.meta.dirname')
  })

  it('defines PASS_THRESHOLD', () => {
    const output = generateEvalDatasetRunner(baseConfig)
    expect(output).toContain('PASS_THRESHOLD')
  })

  it('exports a DatasetRecord interface with input and expectedOutput', () => {
    const output = generateEvalDatasetRunner(baseConfig)
    expect(output).toContain('input: string')
    expect(output).toContain('expectedOutput: string')
  })

  it('calls generateText for both model and judge', () => {
    const output = generateEvalDatasetRunner(baseConfig)
    const count = (output.match(/generateText\(/g) ?? []).length
    expect(count).toBeGreaterThanOrEqual(2)
  })

  it('exits with code 1 when mean score falls below threshold', () => {
    const output = generateEvalDatasetRunner(baseConfig)
    expect(output).toContain('process.exit(1)')
    expect(output).toContain('PASS_THRESHOLD')
  })

  it('prints a run command comment at the top', () => {
    const output = generateEvalDatasetRunner(baseConfig)
    expect(output).toContain('npx tsx evals/dataset-runner.ts')
  })

  it('snapshot', () => {
    expect(generateEvalDatasetRunner(baseConfig)).toMatchSnapshot()
  })
})

describe('generateEvalDatasetWorkflow', () => {
  it('is a YAML file with name: AI Eval', () => {
    const output = generateEvalDatasetWorkflow(baseConfig)
    expect(output).toContain('name: AI Eval')
  })

  it('triggers on pull_request to main and workflow_dispatch', () => {
    const output = generateEvalDatasetWorkflow(baseConfig)
    expect(output).toContain('pull_request:')
    expect(output).toContain('branches: [main]')
    expect(output).toContain('workflow_dispatch:')
  })

  it('runs npx tsx with the runner path', () => {
    const output = generateEvalDatasetWorkflow(baseConfig)
    expect(output).toContain('npx tsx evals/dataset-runner.ts')
  })

  it('injects the provider env var from a repository secret', () => {
    const output = generateEvalDatasetWorkflow(baseConfig)
    expect(output).toContain(providers[1]!.envVar)
    expect(output).toContain('secrets.')
  })

  it('works with anthropic provider', () => {
    const output = generateEvalDatasetWorkflow({ ...baseConfig, provider: providers[0]! })
    expect(output).toContain(providers[0]!.envVar)
  })

  it('snapshot', () => {
    expect(generateEvalDatasetWorkflow(baseConfig)).toMatchSnapshot()
  })
})
