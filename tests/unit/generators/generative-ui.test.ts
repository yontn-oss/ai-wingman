import { describe, it, expect } from 'vitest'
import { generateGenerativeUiRoute } from '../../../src/generators/generative-ui-route.js'
import { generateGenerativeUiPage } from '../../../src/generators/generative-ui-page.js'
import type { GenerativeUiConfig } from '../../../src/types.js'
import { providers } from '../../../src/registry/providers.js'

const baseConfig: GenerativeUiConfig = {
  auth: false,
  paths: {
    apiRoute: 'app/api/generative-ui/route.ts',
    page: 'app/generative-ui/page.tsx',
  },
  pathOverwrites: {},
  provider: providers[1]!, // openai
  pathAlias: '@/',
  hasSrcDir: false,
  packageManager: 'pnpm',
  targetDir: '/tmp/test',
}

describe('generateGenerativeUiRoute', () => {
  it('is a standard POST route (no use server)', () => {
    const output = generateGenerativeUiRoute(baseConfig)
    expect(output).not.toContain("'use server'")
    expect(output).toContain('export async function POST')
  })

  it('imports streamText and convertToModelMessages from ai', () => {
    const output = generateGenerativeUiRoute(baseConfig)
    expect(output).toContain("import { convertToModelMessages, streamText } from 'ai'")
  })

  it('imports the provider package', () => {
    const output = generateGenerativeUiRoute(baseConfig)
    expect(output).toContain("import { openai } from '@ai-sdk/openai'")
  })

  it('imports zod for tool parameter schemas', () => {
    const output = generateGenerativeUiRoute(baseConfig)
    expect(output).toContain("import { z } from 'zod'")
  })

  it('calls streamText with the configured model', () => {
    const output = generateGenerativeUiRoute(baseConfig)
    expect(output).toContain('streamText({')
    expect(output).toContain(providers[1]!.modelFactory)
  })

  it('defines a card tool with title and body parameters', () => {
    const output = generateGenerativeUiRoute(baseConfig)
    expect(output).toContain('card:')
    expect(output).toContain("z.string().describe('Card heading')")
    expect(output).toContain("z.string().describe('Card body text')")
  })

  it('returns toUIMessageStreamResponse', () => {
    const output = generateGenerativeUiRoute(baseConfig)
    expect(output).toContain('return result.toUIMessageStreamResponse()')
  })

  it('exports maxDuration', () => {
    const output = generateGenerativeUiRoute(baseConfig)
    expect(output).toContain('export const maxDuration = 30')
  })

  it('includes auth stub when auth is false', () => {
    const output = generateGenerativeUiRoute(baseConfig)
    expect(output).toContain('TODO: bring your own auth')
  })

  it('includes auth guard when auth is true', () => {
    const output = generateGenerativeUiRoute({ ...baseConfig, auth: true })
    expect(output).toContain("import { auth } from '@/auth'")
    expect(output).toContain('Unauthorized')
    expect(output).not.toContain('TODO: bring your own auth')
  })

  it('snapshot — no auth', () => {
    expect(generateGenerativeUiRoute(baseConfig)).toMatchSnapshot()
  })
})

describe('generateGenerativeUiPage', () => {
  it('adds use client directive', () => {
    const output = generateGenerativeUiPage(baseConfig)
    expect(output).toMatch(/^'use client'/)
  })

  it('imports useChat from @ai-sdk/react', () => {
    const output = generateGenerativeUiPage(baseConfig)
    expect(output).toContain("import { useChat } from '@ai-sdk/react'")
  })

  it('imports DefaultChatTransport from ai', () => {
    const output = generateGenerativeUiPage(baseConfig)
    expect(output).toContain("import { DefaultChatTransport } from 'ai'")
  })

  it('derives the API path from the route file path', () => {
    const output = generateGenerativeUiPage(baseConfig)
    expect(output).toContain("api: '/api/generative-ui'")
  })

  it('imports shadcn Button and Textarea', () => {
    const output = generateGenerativeUiPage(baseConfig)
    expect(output).toContain("from '@/components/ui/button'")
    expect(output).toContain("from '@/components/ui/textarea'")
  })

  it('renders card tool result with title and body', () => {
    const output = generateGenerativeUiPage(baseConfig)
    expect(output).toContain("p.toolName === 'card'")
    expect(output).toContain('p.input?.title')
    expect(output).toContain('p.input?.body')
  })

  it('shows loading skeleton while tool streams in', () => {
    const output = generateGenerativeUiPage(baseConfig)
    expect(output).toContain('animate-pulse')
    expect(output).toContain("p.state !== 'output-available'")
  })

  it('handles text parts', () => {
    const output = generateGenerativeUiPage(baseConfig)
    expect(output).toContain("part.type === 'text'")
  })

  it('snapshot', () => {
    expect(generateGenerativeUiPage(baseConfig)).toMatchSnapshot()
  })
})
