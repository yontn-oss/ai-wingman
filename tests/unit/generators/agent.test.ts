import { describe, it, expect } from 'vitest'
import { generateAgentRoute } from '../../../src/generators/agent-route.js'
import { generateAgentPage } from '../../../src/generators/agent-page.js'
import type { AgentConfig } from '../../../src/types.js'
import { providers } from '../../../src/registry/providers.js'

const baseConfig: AgentConfig = {
  agentName: 'myAgent',
  auth: false,
  includePage: true,
  paths: {
    apiRoute: 'app/api/agent/route.ts',
    toolsFile: 'lib/agent-tools/my-agent.tools.ts',
    storage: 'lib/agent-storage.ts',
    page: 'app/agent/page.tsx',
  },
  pathOverwrites: {},
  provider: providers[0]!, // anthropic
  pathAlias: '@/',
  hasSrcDir: false,
  packageManager: 'pnpm',
  targetDir: '/tmp/test',
}

describe('generateAgentRoute', () => {
  it('imports streamText, generateId, stepCountIs, UIMessage from ai', () => {
    const output = generateAgentRoute(baseConfig)
    expect(output).toContain("import { convertToModelMessages, generateId, stepCountIs, streamText } from 'ai'")
    expect(output).toContain("import type { UIMessage } from 'ai'")
  })

  it('imports tools and storage', () => {
    const output = generateAgentRoute(baseConfig)
    expect(output).toContain("myAgentTools } from '@/lib/agent-tools/my-agent.tools'")
    expect(output).toContain("storage } from '@/lib/agent-storage'")
  })

  it('uses streamText with tools and stopWhen: stepCountIs(20)', () => {
    const output = generateAgentRoute(baseConfig)
    expect(output).toContain('tools: myAgentTools')
    expect(output).toContain('stopWhen: stepCountIs(20)')
  })

  it('saves messages to storage in onFinish', () => {
    const output = generateAgentRoute(baseConfig)
    expect(output).toContain('onFinish')
    expect(output).toContain('storage.saveMessages(conversationId')
  })

  it('returns toUIMessageStreamResponse', () => {
    const output = generateAgentRoute(baseConfig)
    expect(output).toContain('toUIMessageStreamResponse()')
  })

  it('wraps streamText in try/catch returning 500 on failure', () => {
    const output = generateAgentRoute(baseConfig)
    expect(output).toContain('try {')
    expect(output).toContain('} catch {')
    expect(output).toContain('status: 500')
  })

  it('includes auth stub when auth is false', () => {
    const output = generateAgentRoute(baseConfig)
    expect(output).toContain('TODO: bring your own auth')
  })

  it('includes auth guard when auth is true', () => {
    const output = generateAgentRoute({ ...baseConfig, auth: true })
    expect(output).toContain("import { auth } from '@/auth'")
    expect(output).toContain('Unauthorized')
    expect(output).not.toContain('TODO: bring your own auth')
  })

  it('uses custom agent name in tools var', () => {
    const output = generateAgentRoute({ ...baseConfig, agentName: 'researchAgent' })
    expect(output).toContain('researchAgentTools')
  })

  it('sets maxDuration to 60 for longer agent runs', () => {
    const output = generateAgentRoute(baseConfig)
    expect(output).toContain('maxDuration = 60')
  })

  it('snapshot — no auth', () => {
    expect(generateAgentRoute(baseConfig)).toMatchSnapshot()
  })
})

describe('generateAgentPage', () => {
  it('uses useChat with DefaultChatTransport and conversationId in body', () => {
    const output = generateAgentPage(baseConfig)
    expect(output).toContain('DefaultChatTransport')
    expect(output).toContain('conversationId')
    expect(output).toContain('api: API_PATH')
  })

  it('generates a fresh UUID for each page mount', () => {
    const output = generateAgentPage(baseConfig)
    expect(output).toContain('crypto.randomUUID()')
    expect(output).toContain('useState(() => crypto.randomUUID())')
  })

  it('renders tool parts inline', () => {
    const output = generateAgentPage(baseConfig)
    expect(output).toContain('isToolUIPart')
    expect(output).toContain('toolParts')
    expect(output).toContain('toolCallId')
  })

  it('imports ai-elements components', () => {
    const output = generateAgentPage(baseConfig)
    expect(output).toContain('ai-elements/conversation')
    expect(output).toContain('ai-elements/message')
    expect(output).toContain('ai-elements/prompt-input')
  })

  it('uses the correct api path derived from apiRoute', () => {
    const output = generateAgentPage(baseConfig)
    expect(output).toContain("const API_PATH = '/api/agent'")
  })

  it('snapshot', () => {
    expect(generateAgentPage(baseConfig)).toMatchSnapshot()
  })
})
