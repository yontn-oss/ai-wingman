import * as clack from '@clack/prompts'
import { resolveAllPatterns } from '../../registry/patterns.js'

export function listCommand(): void {
  clack.intro('ai-wingman — available patterns')

  const patterns = resolveAllPatterns()
  const idWidth = Math.max(...patterns.map((p) => p.id.length)) + 2

  for (const pattern of patterns) {
    const id = pattern.id.padEnd(idWidth)
    clack.log.info(`${id}${pattern.description}`)
  }

  clack.outro(`Run \`wingman add <pattern>\` to scaffold one or more patterns`)
}
