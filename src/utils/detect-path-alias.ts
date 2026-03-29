import fs from 'node:fs'
import path from 'node:path'
import { stripJsonc } from './strip-jsonc.js'

export interface PathAliasConfig {
  /** Import prefix, e.g. '~/' or '~/' */
  prefix: string
  /** Whether the project uses a src/ directory layout */
  hasSrcDir: boolean
}

export function detectPathAlias(targetDir: string): PathAliasConfig {
  const hasSrcDir =
    fs.existsSync(path.join(targetDir, 'src', 'app')) ||
    fs.existsSync(path.join(targetDir, 'src', 'pages'))

  try {
    const raw = fs.readFileSync(path.join(targetDir, 'tsconfig.json'), 'utf8')
    const stripped = stripJsonc(raw)
    const tsconfig = JSON.parse(stripped) as { compilerOptions?: { paths?: Record<string, string[]> } }
    const tsPaths = tsconfig.compilerOptions?.paths ?? {}

    // Patterns that represent "the project root" or "src/"
    const rootPatterns = new Set(['./*', './src/*', 'src/*', '*'])

    for (const [alias, targets] of Object.entries(tsPaths)) {
      const target = targets[0]
      if (!alias.endsWith('/*') || typeof target !== 'string') continue
      if (rootPatterns.has(target)) {
        return { prefix: alias.replace('/*', '/'), hasSrcDir }
      }
    }
  } catch {
    // tsconfig unreadable — fall through to default
  }

  return { prefix: '~/', hasSrcDir }
}
