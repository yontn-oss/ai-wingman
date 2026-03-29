import { describe, it, expect } from 'vitest'
import { buildAiElementsArgs, AI_ELEMENTS_COMPONENTS } from '../../../src/steps/run-ai-elements.js'

describe('buildAiElementsArgs', () => {
  it('calls shadcn directly, not the ai-elements binary', () => {
    const [cmd, args] = buildAiElementsArgs()
    expect(cmd).toBe('npx')
    expect(args[0]).toBe('shadcn@latest')
    expect(args[1]).toBe('add')
  })

  it('passes a registry URL for every ai-elements component', () => {
    const [, args] = buildAiElementsArgs()
    const urlArgs = args.filter((a) => a.startsWith('https://'))
    expect(urlArgs).toHaveLength(AI_ELEMENTS_COMPONENTS.length)
    for (const component of AI_ELEMENTS_COMPONENTS) {
      expect(urlArgs.some((u) => u.endsWith(`/${component}.json`))).toBe(true)
    }
  })

  it('includes --overwrite to avoid file-conflict prompts', () => {
    const [, args] = buildAiElementsArgs()
    expect(args).toContain('--overwrite')
  })

  it('appends extraArgs after the fixed args', () => {
    const [, args] = buildAiElementsArgs(['--yes', '--base', 'radix'])
    expect(args).toContain('--yes')
    expect(args).toContain('--base')
    expect(args).toContain('radix')
  })

  it('regression: --yes is never treated as a component name', () => {
    // The original bug: `npx ai-elements@latest add ... --yes` made ai-elements
    // fetch https://elements.ai-sdk.dev/api/registry/--yes.json
    const [, args] = buildAiElementsArgs(['--yes'])
    const urlArgs = args.filter((a) => a.startsWith('https://'))
    expect(urlArgs.every((u) => !u.includes('--yes'))).toBe(true)
  })
})
