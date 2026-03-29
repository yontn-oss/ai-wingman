import { describe, it, expect } from 'vitest'
import { buildShadcnArgs } from '../../../src/steps/run-shadcn.js'

describe('buildShadcnArgs', () => {
  it('calls shadcn@latest add with the given components', () => {
    const [cmd, args] = buildShadcnArgs(['button', 'input'])
    expect(cmd).toBe('npx')
    expect(args).toContain('shadcn@latest')
    expect(args).toContain('add')
    expect(args).toContain('button')
    expect(args).toContain('input')
  })

  it('includes --overwrite to avoid file-conflict prompts', () => {
    const [, args] = buildShadcnArgs(['button'])
    expect(args).toContain('--overwrite')
  })

  it('appends extraArgs after the fixed args', () => {
    const [, args] = buildShadcnArgs(['button'], ['--yes', '--base', 'radix'])
    expect(args).toContain('--yes')
    expect(args).toContain('--base')
    expect(args).toContain('radix')
  })
})
