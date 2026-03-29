import { describe, it, expect } from 'vitest'
import { generateInterruptTools } from '../../../src/generators/interrupt-tools.js'
import { generateApprovalWidget } from '../../../src/generators/interrupt-approval-widget.js'
import { generateInterruptPage } from '../../../src/generators/interrupt-page.js'
import { generateInterruptRoute } from '../../../src/generators/interrupt-route.js'
import type { InterruptPatternConfig } from '../../../src/types.js'
import { providers } from '../../../src/registry/providers.js'

const baseConfig: InterruptPatternConfig = {
  provider: providers[0]!, // anthropic
  paths: {
    apiRoute: 'app/api/interrupt/route.ts',
    tools: 'lib/interrupt-tools.ts',
    component: 'components/approval-widget.tsx',
    page: 'app/interrupt/page.tsx',
  },
  pathOverwrites: {},
  includePage: true,
  pathAlias: '@/',
  hasSrcDir: false,
  packageManager: 'npm',
  targetDir: '/tmp/test',
}

describe('generateInterruptTools', () => {
  it('is config-invariant', () => {
    const a = generateInterruptTools(baseConfig)
    const b = generateInterruptTools({ ...baseConfig, provider: providers[1]! })
    expect(a).toEqual(b)
  })

  it('uses needsApproval: true on tools', () => {
    const output = generateInterruptTools(baseConfig)
    expect(output).toContain('needsApproval: true')
  })

  it('exports APPROVAL_TOOLS object', () => {
    const output = generateInterruptTools(baseConfig)
    expect(output).toContain('APPROVAL_TOOLS')
  })

  it('exports a sendEmail stub tool', () => {
    const output = generateInterruptTools(baseConfig)
    expect(output).toContain('sendEmail')
    expect(output).toContain("import { tool } from 'ai'")
    expect(output).toContain('execute:')
  })

  it('does not export old v5 types', () => {
    const output = generateInterruptTools(baseConfig)
    expect(output).not.toContain('PendingApproval')
    expect(output).not.toContain('ApprovalDecision')
    expect(output).not.toContain('APPROVAL_REQUIRED_TOOLS')
    expect(output).not.toContain('requireApprovalTool')
  })

  it('snapshot', () => {
    expect(generateInterruptTools(baseConfig)).toMatchSnapshot()
  })
})

describe('generateApprovalWidget', () => {
  it('imports UIMessage from ai', () => {
    expect(generateApprovalWidget(baseConfig)).toContain("import type { UIMessage } from 'ai'")
  })

  it('imports isToolUIPart from ai', () => {
    expect(generateApprovalWidget(baseConfig)).toContain("import { isToolUIPart } from 'ai'")
  })

  it('uses addToolApprovalResponse instead of onDecision/append', () => {
    const output = generateApprovalWidget(baseConfig)
    expect(output).toContain('addToolApprovalResponse')
    expect(output).not.toContain('onDecision')
    expect(output).not.toContain('append')
  })

  it('filters parts for approval-requested state', () => {
    const output = generateApprovalWidget(baseConfig)
    expect(output).toContain("approval-requested")
    expect(output).toContain('isToolUIPart')
  })

  it('calls addToolApprovalResponse with id and approved', () => {
    const output = generateApprovalWidget(baseConfig)
    expect(output).toContain('p.approval.id')
    expect(output).toContain('approved: true')
    expect(output).toContain('approved: false')
  })

  it('renders Approve and Reject buttons', () => {
    const output = generateApprovalWidget(baseConfig)
    expect(output).toContain('Approve')
    expect(output).toContain('Reject')
  })

  it('uses no UI library — only plain div and button elements', () => {
    const output = generateApprovalWidget(baseConfig)
    expect(output).not.toContain('import { Button')
    expect(output).not.toContain("from '@/components/ui/button'")
  })

  it('snapshot — @/ alias', () => {
    expect(generateApprovalWidget(baseConfig)).toMatchSnapshot()
  })

  it('snapshot — ~/ alias', () => {
    expect(generateApprovalWidget({ ...baseConfig, pathAlias: '~/' })).toMatchSnapshot()
  })
})

describe('generateInterruptRoute', () => {
  it('imports streamText, convertToModelMessages, stepCountIs from ai', () => {
    const output = generateInterruptRoute(baseConfig)
    expect(output).toContain("import { convertToModelMessages, stepCountIs, streamText } from 'ai'")
  })

  it('imports APPROVAL_TOOLS from the tools path', () => {
    const output = generateInterruptRoute(baseConfig)
    expect(output).toContain("import { APPROVAL_TOOLS } from '@/lib/interrupt-tools'")
  })

  it('imports the correct provider', () => {
    const output = generateInterruptRoute(baseConfig)
    expect(output).toContain(`import { ${providers[0]!.importName} } from '${providers[0]!.package}'`)
  })

  it('uses APPROVAL_TOOLS in streamText', () => {
    const output = generateInterruptRoute(baseConfig)
    expect(output).toContain('tools: APPROVAL_TOOLS')
  })

  it('uses stopWhen: stepCountIs(5)', () => {
    const output = generateInterruptRoute(baseConfig)
    expect(output).toContain('stopWhen: stepCountIs(5)')
  })

  it('returns toUIMessageStreamResponse()', () => {
    const output = generateInterruptRoute(baseConfig)
    expect(output).toContain('result.toUIMessageStreamResponse()')
  })

  it('exports maxDuration = 30', () => {
    const output = generateInterruptRoute(baseConfig)
    expect(output).toContain('export const maxDuration = 30')
  })

  it('respects ~/ path alias for tools import', () => {
    const output = generateInterruptRoute({ ...baseConfig, pathAlias: '~/' })
    expect(output).toContain("from '~/lib/interrupt-tools'")
  })

  it('snapshot — @/ alias', () => {
    expect(generateInterruptRoute(baseConfig)).toMatchSnapshot()
  })

  it('snapshot — ~/ alias', () => {
    expect(generateInterruptRoute({ ...baseConfig, pathAlias: '~/' })).toMatchSnapshot()
  })
})

describe('generateInterruptPage', () => {
  it('returns empty string when includePage is false', () => {
    const output = generateInterruptPage({ ...baseConfig, includePage: false })
    expect(output).toBe('')
  })

  it('imports useChat from @ai-sdk/react', () => {
    const output = generateInterruptPage(baseConfig)
    expect(output).toContain("import { useChat } from '@ai-sdk/react'")
  })

  it('imports DefaultChatTransport from ai', () => {
    const output = generateInterruptPage(baseConfig)
    expect(output).toContain("import { DefaultChatTransport } from 'ai'")
  })

  it('imports ApprovalWidget from the component path', () => {
    const output = generateInterruptPage(baseConfig)
    expect(output).toContain("import { ApprovalWidget } from '@/components/approval-widget'")
  })

  it('derives the correct api path from apiRoute', () => {
    const output = generateInterruptPage(baseConfig)
    expect(output).toContain("api: '/api/interrupt'")
  })

  it('uses addToolApprovalResponse from useChat', () => {
    const output = generateInterruptPage(baseConfig)
    expect(output).toContain('addToolApprovalResponse')
  })

  it('renders ApprovalWidget with messages and addToolApprovalResponse', () => {
    const output = generateInterruptPage(baseConfig)
    expect(output).toContain('<ApprovalWidget messages={messages} addToolApprovalResponse={addToolApprovalResponse}')
  })

  it('disables input when status is not ready', () => {
    const output = generateInterruptPage(baseConfig)
    expect(output).toContain("disabled={status !== 'ready'}")
  })

  it('snapshot — @/ alias', () => {
    expect(generateInterruptPage(baseConfig)).toMatchSnapshot()
  })

  it('snapshot — ~/ alias', () => {
    expect(generateInterruptPage({ ...baseConfig, pathAlias: '~/' })).toMatchSnapshot()
  })
})
