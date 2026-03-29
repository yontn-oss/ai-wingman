import { describe, it, expect } from 'vitest'
import { generateApiRoute, generateConversationsRoute, generateConversationByIdRoute } from '../../../src/generators/api-route.js'
import type { WingmanConfig } from '../../../src/types.js'
import { providers } from '../../../src/registry/providers.js'
import { storageAdapters } from '../../../src/registry/storage-adapters.js'

const baseConfig: WingmanConfig = {
  components: ['api-route'],
  provider: providers[0]!, // anthropic
  storage: storageAdapters[0]!, // memory
  auth: false,
  paths: { apiRoute: 'app/api/chat/route.ts' },
  pathOverwrites: {},
  targetDir: '/tmp/test',
  pathAlias: '~/',
  hasSrcDir: false,
}

const withStorage: WingmanConfig = {
  ...baseConfig,
  components: ['api-route', 'storage'],
  paths: { apiRoute: 'app/api/chat/route.ts', storage: 'lib/storage.ts' },
}

describe('generateApiRoute', () => {
  it('generates basic route with stubs when no storage or auth', () => {
    const output = generateApiRoute(baseConfig)
    expect(output).toContain("import { convertToModelMessages, streamText } from 'ai'")
    expect(output).toContain("import { anthropic } from '@ai-sdk/anthropic'")
    expect(output).toContain('TODO: bring your own auth')
    expect(output).toContain('TODO: bring your own storage')
    expect(output).toContain('toUIMessageStreamResponse({ sendReasoning: true, sendSources: true })')
    expect(output).toMatchSnapshot()
  })

  it('includes storage import and onFinish persistence when storage component selected', () => {
    const output = generateApiRoute(withStorage)
    expect(output).toContain("import { storage } from '~/lib/storage'")
    expect(output).toContain('conversationId')
    expect(output).toContain('onFinish')
    expect(output).toContain('response.messages')
    expect(output).toContain('generateId')
    expect(output).not.toContain('TODO: bring your own storage')
    // Must NOT call saveMessages outside onFinish
    expect(output).not.toMatch(/saveMessages[\s\S]*?streamText/)
    expect(output).toMatchSnapshot()
  })

  it('never hardcodes a conversation id', () => {
    const output = generateApiRoute(withStorage)
    expect(output).not.toContain("'default'")
  })

  it('merges messages and response.messages in onFinish', () => {
    const output = generateApiRoute(withStorage)
    expect(output).toContain('...messages')
    expect(output).toContain('response.messages')
    expect(output).toContain('UIMessage[]')
  })

  it('includes auth guard when auth selected', () => {
    const config: WingmanConfig = {
      ...baseConfig,
      components: ['api-route', 'auth'],
      auth: true,
    }
    const output = generateApiRoute(config)
    expect(output).toContain("import { auth } from '~/auth'")
    expect(output).toContain('Unauthorized')
    expect(output).not.toContain('TODO: bring your own auth')
    expect(output).toMatchSnapshot()
  })

  it('works with openai provider', () => {
    const output = generateApiRoute({ ...baseConfig, provider: providers[1]! })
    expect(output).toContain("import { openai } from '@ai-sdk/openai'")
    expect(output).toContain(providers[1]!.modelFactory)
    expect(output).toMatchSnapshot()
  })

  it('works with google provider', () => {
    const output = generateApiRoute({ ...baseConfig, provider: providers[2]! })
    expect(output).toContain("import { google } from '@ai-sdk/google'")
    expect(output).toContain(providers[2]!.modelFactory)
    expect(output).toMatchSnapshot()
  })
})

describe('generateApiRoute — with interrupt', () => {
  const withInterrupt: WingmanConfig = {
    ...baseConfig,
    includeInterrupt: true,
    paths: {
      ...baseConfig.paths,
      interruptToolsFile: 'lib/interrupt-tools.ts',
      approvalWidgetFile: 'components/approval-widget.tsx',
    },
  }

  it('includes DATA FLOW comment block when includeInterrupt is true', () => {
    const output = generateApiRoute(withInterrupt)
    expect(output).toContain('DATA FLOW')
    expect(output).toContain('needsApproval')
    expect(output).toContain('approval-requested')
  })

  it('imports APPROVAL_TOOLS when includeInterrupt is true', () => {
    const output = generateApiRoute(withInterrupt)
    expect(output).toContain('APPROVAL_TOOLS')
    expect(output).toContain("from '~/lib/interrupt-tools'")
  })

  it('does NOT include experimental_prepareStep when includeInterrupt is true (v6 native approval)', () => {
    const output = generateApiRoute(withInterrupt)
    expect(output).not.toContain('experimental_prepareStep')
  })

  it('snapshot with interrupt enabled', () => {
    expect(generateApiRoute(withInterrupt)).toMatchSnapshot()
  })

  it('does NOT include DATA FLOW comment when includeInterrupt is false', () => {
    const output = generateApiRoute(baseConfig)
    expect(output).not.toContain('DATA FLOW')
  })

  it('does NOT import APPROVAL_TOOLS when includeInterrupt is false', () => {
    const output = generateApiRoute(baseConfig)
    expect(output).not.toContain('APPROVAL_TOOLS')
  })

  it('does NOT include experimental_prepareStep when includeInterrupt is false', () => {
    const output = generateApiRoute(baseConfig)
    expect(output).not.toContain('experimental_prepareStep')
  })
})

describe('generateConversationsRoute', () => {
  it('generates GET and POST handlers', () => {
    const output = generateConversationsRoute(withStorage)
    expect(output).toContain('export async function POST()')
    expect(output).toContain('export async function GET()')
    expect(output).toContain('storage.createConversation()')
    expect(output).toContain('storage.listConversations()')
    expect(output).toContain('status: 201')
    expect(output).toMatchSnapshot()
  })

  it('includes auth guard on both handlers when auth enabled', () => {
    const config: WingmanConfig = { ...withStorage, components: ['api-route', 'storage', 'auth'], auth: true }
    const output = generateConversationsRoute(config)
    expect(output).toContain("import { auth } from '~/auth'")
    // Both handlers should check auth
    expect(output.match(/Unauthorized/g)?.length).toBe(2)
    expect(output).toMatchSnapshot()
  })

  it('imports storage from correct path alias', () => {
    const output = generateConversationsRoute(withStorage)
    expect(output).toContain("import { storage } from '~/lib/storage'")
  })
})

describe('generateConversationByIdRoute', () => {
  it('generates GET handler for single conversation', () => {
    const output = generateConversationByIdRoute(withStorage)
    expect(output).toContain('export async function GET(')
    expect(output).toContain('params: Promise<{ id: string }>')
    expect(output).toContain('storage.getMessages(id)')
    expect(output).toContain('status: 404')
    expect(output).toMatchSnapshot()
  })

  it('includes auth guard when auth enabled', () => {
    const config: WingmanConfig = { ...withStorage, components: ['api-route', 'storage', 'auth'], auth: true }
    const output = generateConversationByIdRoute(config)
    expect(output).toContain("import { auth } from '~/auth'")
    expect(output).toContain('Unauthorized')
    expect(output).toMatchSnapshot()
  })
})

