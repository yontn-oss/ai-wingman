import * as clack from '@clack/prompts'
import process from 'node:process'
import type { ExecutionPlan } from '../types.js'

export async function announcePlan(plan: ExecutionPlan, opts: { yes?: boolean } = {}): Promise<void> {
  const lines: string[] = []

  const runs = plan.entries.filter((e): e is Extract<typeof e, { kind: 'run' }> => e.kind === 'run')
  const creates = plan.entries.filter((e): e is Extract<typeof e, { kind: 'create' }> => e.kind === 'create')

  if (runs.length > 0) {
    lines.push('Run CLIs:')
    for (const e of runs) lines.push(`  ${e.command} ${e.args.join(' ')}`)
    lines.push('')
  }

  if (plan.packages.length > 0) {
    lines.push('Install packages:')
    for (const p of plan.packages) lines.push(`  ${p}`)
    lines.push('')
  }

  if (creates.length > 0) {
    lines.push('Create files:')
    const multiPattern = plan.groups.length > 1
    if (multiPattern) {
      for (const group of plan.groups) {
        const groupCreates = group.entries.filter((e): e is Extract<typeof e, { kind: 'create' }> => e.kind === 'create')
        if (groupCreates.length === 0) continue
        lines.push(`  [${group.patternId}]`)
        for (const e of groupCreates) lines.push(`    ${e.path}${e.overwrite ? '  (overwrite)' : ''}`)
      }
    } else {
      for (const e of creates) lines.push(`  ${e.path}${e.overwrite ? '  (overwrite)' : ''}`)
    }
  }

  clack.note(lines.join('\n'), 'Plan')

  if (opts.yes) return

  const proceed = await clack.confirm({ message: 'Proceed?', initialValue: true })

  if (clack.isCancel(proceed) || !proceed) {
    clack.cancel('Aborted — no changes made.')
    process.exit(0)
  }
}
