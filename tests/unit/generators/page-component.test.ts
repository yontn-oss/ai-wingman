import { describe, it, expect } from 'vitest'
import { generatePageComponent } from '../../../src/generators/page-component.js'
import type { WingmanConfig } from '../../../src/types.js'
import { providers } from '../../../src/registry/providers.js'
import { storageAdapters } from '../../../src/registry/storage-adapters.js'

const baseConfig: WingmanConfig = {
  components: ['api-route', 'chat-ui', 'page-component'],
  provider: providers[0]!,
  storage: storageAdapters[0]!,
  auth: false,
  paths: {
    apiRoute: 'app/api/chat/route.ts',
    pageComponent: 'app/chat/page.tsx',
  },
  pathOverwrites: {},
  targetDir: '/tmp/test',
  pathAlias: '@/',
  hasSrcDir: false,
}

const withStorage: WingmanConfig = {
  ...baseConfig,
  components: ['api-route', 'chat-ui', 'page-component', 'storage'],
  paths: { ...baseConfig.paths, storage: 'lib/storage.ts' },
}

describe('generatePageComponent — P0 message rendering fix', () => {
  it('does NOT contain userMessages filter', () => {
    const output = generatePageComponent(baseConfig)
    expect(output).not.toContain('userMessages')
  })

  it('does NOT use .find(m to pair user+assistant', () => {
    const output = generatePageComponent(baseConfig)
    expect(output).not.toContain('.find(m')
  })

  it('dispatches on msg.role for user messages', () => {
    const output = generatePageComponent(baseConfig)
    expect(output).toContain("msg.role === 'user'")
  })

  it('dispatches on msg.role for assistant messages', () => {
    const output = generatePageComponent(baseConfig)
    expect(output).toContain("msg.role === 'assistant'")
  })

  it('renders tool parts inline on assistant messages', () => {
    const output = generatePageComponent(baseConfig)
    expect(output).toContain('isToolUIPart')
    expect(output).toContain('toolParts')
  })

  it('extracts ChatInner component', () => {
    const output = generatePageComponent(baseConfig)
    expect(output).toContain('function ChatInner(')
    expect(output).toContain('<ChatInner')
  })
})

describe('generatePageComponent — base (no storage)', () => {
  it('generates a client component with correct api path', () => {
    const output = generatePageComponent(baseConfig)
    expect(output).toContain("'use client'")
    expect(output).toContain("api: '/api/chat'")
    expect(output).toContain('DefaultChatTransport')
    expect(output).toContain('sendMessage')
    expect(output).toContain('PromptInput')
    expect(output).toMatchSnapshot()
  })

  it('derives correct api path from nested route', () => {
    const config: WingmanConfig = {
      ...baseConfig,
      paths: { ...baseConfig.paths, apiRoute: 'app/api/v1/assistant/route.ts' },
    }
    expect(generatePageComponent(config)).toContain("api: '/api/v1/assistant'")
  })

  it('includes TODO comment for layout', () => {
    expect(generatePageComponent(baseConfig)).toContain('TODO')
  })

  it('uses @/ alias for component imports', () => {
    const output = generatePageComponent(baseConfig)
    expect(output).toContain("from '@/components/ai-elements/conversation'")
    expect(output).toContain("from '@/components/ai-elements/message'")
    expect(output).toContain("from '@/components/ai-elements/prompt-input'")
    expect(output).toContain("from '@/components/ai-elements/reasoning'")
    expect(output).toContain("from '@/components/ai-elements/sources'")
    expect(output).toContain("from '@/components/ai-elements/suggestion'")
  })

  it('uses all conversation exports', () => {
    const output = generatePageComponent(baseConfig)
    expect(output).toContain('Conversation')
    expect(output).toContain('ConversationContent')
    expect(output).toContain('ConversationEmptyState')
    expect(output).toContain('ConversationScrollButton')
    expect(output).toContain('ConversationDownload')
  })

  it('uses all message exports', () => {
    const output = generatePageComponent(baseConfig)
    expect(output).toContain('MessageContent')
    expect(output).toContain('MessageResponse')
    expect(output).toContain('MessageActions')
    expect(output).toContain('MessageAction')
    expect(output).toContain('MessageToolbar')
    expect(output).toContain('MessageBranch')
    expect(output).toContain('MessageBranchContent')
    expect(output).toContain('MessageBranchSelector')
    expect(output).toContain('MessageBranchPrevious')
    expect(output).toContain('MessageBranchPage')
    expect(output).toContain('MessageBranchNext')
  })

  it('renders both user and assistant roles', () => {
    const output = generatePageComponent(baseConfig)
    expect(output).toContain('from="assistant"')
    expect(output).toContain('from="user"')
  })

  it('renders ConversationEmptyState when no messages', () => {
    const output = generatePageComponent(baseConfig)
    expect(output).toContain('messages.length === 0')
    expect(output).toContain('ConversationEmptyState')
  })

  it('does not include sidebar or conversation fetch when no storage', () => {
    const output = generatePageComponent(baseConfig)
    expect(output).not.toContain('conversations')
    expect(output).not.toContain('/conversations')
    expect(output).not.toContain('sidebar')
  })
})

describe('generatePageComponent — with interrupt', () => {
  const withInterrupt: WingmanConfig = {
    ...baseConfig,
    includeInterrupt: true,
    paths: {
      ...baseConfig.paths,
      interruptToolsFile: 'lib/interrupt-tools.ts',
      approvalWidgetFile: 'components/approval-widget.tsx',
    },
  }

  it('imports ApprovalWidget when includeInterrupt is true', () => {
    const output = generatePageComponent(withInterrupt)
    expect(output).toContain('ApprovalWidget')
    expect(output).toContain("from '@/components/approval-widget'")
  })

  it('destructures addToolApprovalResponse from useChat when includeInterrupt is true', () => {
    const output = generatePageComponent(withInterrupt)
    expect(output).toContain('addToolApprovalResponse')
  })

  it('renders ApprovalWidget with messages and addToolApprovalResponse props', () => {
    const output = generatePageComponent(withInterrupt)
    expect(output).toContain('<ApprovalWidget messages={messages} addToolApprovalResponse={addToolApprovalResponse} />')
  })

  it('snapshot with interrupt enabled', () => {
    expect(generatePageComponent(withInterrupt)).toMatchSnapshot()
  })

  it('does NOT import ApprovalWidget when includeInterrupt is false', () => {
    const output = generatePageComponent(baseConfig)
    expect(output).not.toContain('ApprovalWidget')
  })

  it('does NOT include addToolApprovalResponse when includeInterrupt is false', () => {
    const output = generatePageComponent(baseConfig)
    expect(output).not.toContain('addToolApprovalResponse')
  })
})

describe('generatePageComponent — with storage', () => {
  it('includes conversationId in transport body', () => {
    const output = generatePageComponent(withStorage)
    expect(output).toContain('body: { conversationId }')
  })

  it('keys ChatInner on conversationId for hook remounting', () => {
    const output = generatePageComponent(withStorage)
    expect(output).toContain('key={conversationId}')
  })

  it('fetches conversation list on mount', () => {
    const output = generatePageComponent(withStorage)
    expect(output).toContain('/conversations')
    expect(output).toContain('useEffect')
  })

  it('creates conversation via POST (server-issued id)', () => {
    const output = generatePageComponent(withStorage)
    expect(output).toContain("method: 'POST'")
    expect(output).not.toContain('randomUUID')
  })

  it('renders two-column layout with sidebar', () => {
    const output = generatePageComponent(withStorage)
    expect(output).toContain('w-64')
    expect(output).toContain('border-r')
    expect(output).toContain('New conversation')
  })

  it('accepts initialMessages prop in ChatInner', () => {
    const output = generatePageComponent(withStorage)
    expect(output).toContain('initialMessages')
  })

  it('snapshot matches', () => {
    expect(generatePageComponent(withStorage)).toMatchSnapshot()
  })
})
