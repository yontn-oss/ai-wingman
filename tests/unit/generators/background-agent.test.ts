import { describe, it, expect } from 'vitest'
import { generateBackgroundAgentEnqueueRoute } from '../../../src/generators/background-agent-enqueue-route.js'
import { generateBackgroundAgentStatusRoute } from '../../../src/generators/background-agent-status-route.js'
import { generateBackgroundAgentWorker } from '../../../src/generators/background-agent-worker.js'
import { generateBackgroundAgentJobStore } from '../../../src/generators/background-agent-job-store.js'
import type { BackgroundAgentConfig } from '../../../src/types.js'
import { providers } from '../../../src/registry/providers.js'

const baseConfig: BackgroundAgentConfig = {
  auth: false,
  paths: {
    enqueueRoute: 'app/api/background-agent/enqueue/route.ts',
    statusRoute: 'app/api/background-agent/status/[jobId]/route.ts',
    worker: 'lib/background-agent/worker.ts',
    jobStore: 'lib/background-agent/job-store.ts',
  },
  pathOverwrites: {},
  provider: providers[1]!, // openai
  pathAlias: '@/',
  hasSrcDir: false,
  packageManager: 'npm',
  targetDir: '/tmp/test',
}

describe('generateBackgroundAgentEnqueueRoute', () => {
  it('imports generateId from ai', () => {
    const output = generateBackgroundAgentEnqueueRoute(baseConfig)
    expect(output).toContain("import { generateId } from 'ai'")
  })

  it('imports jobStore from the job store file', () => {
    const output = generateBackgroundAgentEnqueueRoute(baseConfig)
    expect(output).toContain("import { jobStore } from '@/lib/background-agent/job-store'")
  })

  it('imports runWorker from the worker file', () => {
    const output = generateBackgroundAgentEnqueueRoute(baseConfig)
    expect(output).toContain("import { runWorker } from '@/lib/background-agent/worker'")
  })

  it('validates task and returns 400 if missing', () => {
    const output = generateBackgroundAgentEnqueueRoute(baseConfig)
    expect(output).toContain('task is required')
    expect(output).toContain('status: 400')
  })

  it('creates a job with generateId', () => {
    const output = generateBackgroundAgentEnqueueRoute(baseConfig)
    expect(output).toContain('generateId()')
    expect(output).toContain('jobStore.create(jobId, task)')
  })

  it('fires worker with void (fire-and-forget)', () => {
    const output = generateBackgroundAgentEnqueueRoute(baseConfig)
    expect(output).toContain('void runWorker(jobId, task)')
  })

  it('returns { jobId } with status 202', () => {
    const output = generateBackgroundAgentEnqueueRoute(baseConfig)
    expect(output).toContain('{ jobId }')
    expect(output).toContain('status: 202')
  })

  it('includes auth stub when auth is false', () => {
    const output = generateBackgroundAgentEnqueueRoute(baseConfig)
    expect(output).toContain('TODO: bring your own auth')
  })

  it('includes auth guard when auth is true', () => {
    const output = generateBackgroundAgentEnqueueRoute({ ...baseConfig, auth: true })
    expect(output).toContain("import { auth } from '@/auth'")
    expect(output).toContain('Unauthorized')
    expect(output).not.toContain('TODO: bring your own auth')
  })

  it('snapshot', () => {
    expect(generateBackgroundAgentEnqueueRoute(baseConfig)).toMatchSnapshot()
  })
})

describe('generateBackgroundAgentStatusRoute', () => {
  it('imports jobStore from the job store file', () => {
    const output = generateBackgroundAgentStatusRoute(baseConfig)
    expect(output).toContain("import { jobStore } from '@/lib/background-agent/job-store'")
  })

  it('accepts dynamic [jobId] param via params Promise', () => {
    const output = generateBackgroundAgentStatusRoute(baseConfig)
    expect(output).toContain('params: Promise<{ jobId: string }>')
    expect(output).toContain('const { jobId } = await params')
  })

  it('returns 404 when job is not found', () => {
    const output = generateBackgroundAgentStatusRoute(baseConfig)
    expect(output).toContain('Job not found')
    expect(output).toContain('status: 404')
  })

  it('returns { status, result?, error? }', () => {
    const output = generateBackgroundAgentStatusRoute(baseConfig)
    expect(output).toContain('status: job.status')
    expect(output).toContain('job.result')
    expect(output).toContain('job.error')
  })

  it('includes auth stub when auth is false', () => {
    const output = generateBackgroundAgentStatusRoute(baseConfig)
    expect(output).toContain('TODO: bring your own auth')
  })

  it('includes auth guard when auth is true', () => {
    const output = generateBackgroundAgentStatusRoute({ ...baseConfig, auth: true })
    expect(output).toContain("import { auth } from '@/auth'")
    expect(output).toContain('Unauthorized')
  })

  it('snapshot', () => {
    expect(generateBackgroundAgentStatusRoute(baseConfig)).toMatchSnapshot()
  })
})

describe('generateBackgroundAgentWorker', () => {
  it('imports generateText and stepCountIs from ai', () => {
    const output = generateBackgroundAgentWorker(baseConfig)
    expect(output).toContain("import { generateText, stepCountIs } from 'ai'")
  })

  it('imports the provider package', () => {
    const output = generateBackgroundAgentWorker(baseConfig)
    expect(output).toContain("import { openai } from '@ai-sdk/openai'")
  })

  it('imports jobStore from the job store file', () => {
    const output = generateBackgroundAgentWorker(baseConfig)
    expect(output).toContain("import { jobStore } from '@/lib/background-agent/job-store'")
  })

  it('exports runWorker function', () => {
    const output = generateBackgroundAgentWorker(baseConfig)
    expect(output).toContain('export async function runWorker(')
  })

  it('uses the provider model factory', () => {
    const output = generateBackgroundAgentWorker(baseConfig)
    expect(output).toContain(providers[1]!.modelFactory)
  })

  it('calls jobStore.setRunning, setDone, and setFailed', () => {
    const output = generateBackgroundAgentWorker(baseConfig)
    expect(output).toContain('jobStore.setRunning(jobId)')
    expect(output).toContain('jobStore.setDone(jobId, text)')
    expect(output).toContain('jobStore.setFailed(')
  })

  it('uses generateText with stopWhen', () => {
    const output = generateBackgroundAgentWorker(baseConfig)
    expect(output).toContain('generateText(')
    expect(output).toContain('stopWhen: stepCountIs(20)')
  })

  it('snapshot', () => {
    expect(generateBackgroundAgentWorker(baseConfig)).toMatchSnapshot()
  })
})

describe('generateBackgroundAgentJobStore', () => {
  it('exports JobStatus type with all states', () => {
    const output = generateBackgroundAgentJobStore()
    expect(output).toContain("export type JobStatus = 'pending' | 'running' | 'done' | 'failed'")
  })

  it('exports JobEntry interface with required fields', () => {
    const output = generateBackgroundAgentJobStore()
    expect(output).toContain('export interface JobEntry')
    expect(output).toContain('id: string')
    expect(output).toContain('task: string')
    expect(output).toContain('status: JobStatus')
    expect(output).toContain('result?: string')
  })

  it('exports JobStore interface with create, setRunning, setDone, setFailed, get', () => {
    const output = generateBackgroundAgentJobStore()
    expect(output).toContain('export interface JobStore')
    expect(output).toContain('create(')
    expect(output).toContain('setRunning(')
    expect(output).toContain('setDone(')
    expect(output).toContain('setFailed(')
    expect(output).toContain('get(')
  })

  it('exports jobStore singleton', () => {
    const output = generateBackgroundAgentJobStore()
    expect(output).toContain('export const jobStore: JobStore')
  })

  it('uses globalThis to survive hot-reloads', () => {
    const output = generateBackgroundAgentJobStore()
    expect(output).toContain('globalThis')
  })

  it('snapshot', () => {
    expect(generateBackgroundAgentJobStore()).toMatchSnapshot()
  })
})
