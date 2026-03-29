import type { Command } from 'commander'
import type { Pattern } from '../types.js'

/** Flags every pattern accepts — no need to declare these per-pattern. */
const UNIVERSAL_FLAGS = new Set(['provider', 'auth', 'overwrite', 'yes'])

function camelToKebab(s: string): string {
  return s.replace(/([A-Z])/g, '-$1').toLowerCase()
}

/**
 * Warns when the user passes a CLI flag that the target pattern doesn't accept.
 * Returns the list of invalid flag names (empty if all OK).
 */
export function validateFlags(pattern: Pattern, command: Command): string[] {
  const accepted = new Set([...UNIVERSAL_FLAGS, ...pattern.cliFlags])
  const invalid: string[] = []

  for (const opt of command.options) {
    const key = opt.attributeName()
    if (command.getOptionValueSource(key) === 'cli' && !accepted.has(key)) {
      invalid.push(`--${camelToKebab(key)}`)
    }
  }

  return invalid
}
