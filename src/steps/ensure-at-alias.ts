import * as clack from '@clack/prompts'
import fs from 'node:fs'
import path from 'node:path'
import { stripJsonc } from '../utils/strip-jsonc.js'

/**
 * ai-elements components hardcode `@/components/ui/...` and `@/lib/utils` in
 * their source files, regardless of the project's own path alias. For these
 * imports to resolve, `tsconfig.json` must have `"@/*"` in `compilerOptions.paths`.
 *
 * This step reads the tsconfig, adds `"@/*": ["./*"]` if missing, and writes
 * the file back as clean JSON. (Comments and trailing commas are stripped —
 * the same thing shadcn does when it modifies tsconfig.)
 */
export function ensureAtAlias(targetDir: string): void {
  const tsconfigPath = path.join(targetDir, 'tsconfig.json')
  if (!fs.existsSync(tsconfigPath)) return

  const raw = fs.readFileSync(tsconfigPath, 'utf8')

  // Quick bail-out: alias already present
  if (raw.includes('"@/*"')) return

  let tsconfig: {
    compilerOptions?: {
      baseUrl?: string
      paths?: Record<string, string[]>
    }
    [key: string]: unknown
  }

  try {
    tsconfig = JSON.parse(stripJsonc(raw)) as typeof tsconfig
  } catch {
    clack.log.warn('Could not parse tsconfig.json — skipping @/* alias check')
    return
  }

  tsconfig.compilerOptions ??= {}
  tsconfig.compilerOptions.paths ??= {}

  // "@/*" → "./*" works for both src/ and non-src/ layouts because shadcn
  // always installs components/ and lib/ at the project root, not inside src/.
  tsconfig.compilerOptions.paths['@/*'] = ['./*']

  // paths requires baseUrl to be set
  tsconfig.compilerOptions.baseUrl ??= '.'

  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n', 'utf8')
  clack.log.success('Added "@/*" to tsconfig.json (required by ai-elements components)')
}
