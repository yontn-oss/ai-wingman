import { describe, it, expect } from 'vitest'
import { generateContentModerationRoute } from '../../../src/generators/content-moderation-route.js'
import { generateContentModerationPolicy } from '../../../src/generators/content-moderation-policy.js'
import type { ContentModerationConfig } from '../../../src/types.js'
import { providers } from '../../../src/registry/providers.js'

const baseConfig: ContentModerationConfig = {
  auth: false,
  paths: {
    apiRoute: 'app/api/content-moderation/route.ts',
    policy: 'lib/moderation/policy.ts',
  },
  pathOverwrites: {},
  provider: providers[0]!, // anthropic
  pathAlias: '@/',
  targetDir: '/tmp/test',
}

describe('generateContentModerationRoute', () => {
  it('imports generateText and Output from ai', () => {
    const output = generateContentModerationRoute(baseConfig)
    expect(output).toContain("import { generateText, Output } from 'ai'")
  })

  it('imports the provider package', () => {
    const output = generateContentModerationRoute(baseConfig)
    expect(output).toContain("import { anthropic } from '@ai-sdk/anthropic'")
  })

  it('imports POLICY_CATEGORIES from the policy file', () => {
    const output = generateContentModerationRoute(baseConfig)
    expect(output).toContain("import { POLICY_CATEGORIES } from '@/lib/moderation/policy'")
  })

  it('defines the moderation schema inline', () => {
    const output = generateContentModerationRoute(baseConfig)
    expect(output).toContain('const moderationSchema = z.object(')
    expect(output).toContain('allowed:')
    expect(output).toContain('category:')
    expect(output).toContain('reason:')
  })

  it('calls generateText with Output.object and moderation schema', () => {
    const output = generateContentModerationRoute(baseConfig)
    expect(output).toContain('generateText({')
    expect(output).toContain('Output.object({ schema: moderationSchema })')
  })

  it('uses the configured model factory', () => {
    const output = generateContentModerationRoute(baseConfig)
    expect(output).toContain(providers[0]!.modelFactory)
  })

  it('validates input and returns 400 if missing', () => {
    const output = generateContentModerationRoute(baseConfig)
    expect(output).toContain("status: 400")
    expect(output).toContain('input is required')
  })

  it('builds category list from POLICY_CATEGORIES', () => {
    const output = generateContentModerationRoute(baseConfig)
    expect(output).toContain('POLICY_CATEGORIES')
    expect(output).toContain('.map(')
    expect(output).toContain("Policy categories:")
  })

  it('returns Response.json(output)', () => {
    const output = generateContentModerationRoute(baseConfig)
    expect(output).toContain('return Response.json(output)')
  })

  it('exports maxDuration', () => {
    const output = generateContentModerationRoute(baseConfig)
    expect(output).toContain('export const maxDuration = 30')
  })

  it('exports POST function', () => {
    const output = generateContentModerationRoute(baseConfig)
    expect(output).toContain('export async function POST')
  })

  it('includes auth stub when auth is false', () => {
    const output = generateContentModerationRoute(baseConfig)
    expect(output).toContain('TODO: bring your own auth')
  })

  it('includes auth guard when auth is true', () => {
    const output = generateContentModerationRoute({ ...baseConfig, auth: true })
    expect(output).toContain("import { auth } from '@/auth'")
    expect(output).toContain('Unauthorized')
    expect(output).not.toContain('TODO: bring your own auth')
  })

  it('strips src/ prefix from policy import path', () => {
    const config: ContentModerationConfig = {
      ...baseConfig,
      paths: { ...baseConfig.paths, policy: 'src/lib/moderation/policy.ts' },
    }
    const output = generateContentModerationRoute(config)
    expect(output).toContain("'@/lib/moderation/policy'")
    expect(output).not.toContain('src/')
  })

  it('snapshot — no auth', () => {
    expect(generateContentModerationRoute(baseConfig)).toMatchSnapshot()
  })
})

describe('generateContentModerationPolicy', () => {
  it('exports POLICY_CATEGORIES array', () => {
    const output = generateContentModerationPolicy()
    expect(output).toContain('export const POLICY_CATEGORIES')
    expect(output).toContain('PolicyCategory[]')
  })

  it('exports PolicyCategory interface', () => {
    const output = generateContentModerationPolicy()
    expect(output).toContain('export interface PolicyCategory')
    expect(output).toContain('name: string')
    expect(output).toContain('description: string')
  })

  it('includes starter policy categories', () => {
    const output = generateContentModerationPolicy()
    expect(output).toContain('hate-speech')
    expect(output).toContain('violence')
    expect(output).toContain('spam')
  })

  it('snapshot', () => {
    expect(generateContentModerationPolicy()).toMatchSnapshot()
  })
})
