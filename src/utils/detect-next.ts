import fs from 'node:fs'
import path from 'node:path'

export interface DetectNextResult {
  found: boolean
  version: string | null
}

export function detectNext(targetDir: string): DetectNextResult {
  const pkgPath = path.join(targetDir, 'package.json')
  if (!fs.existsSync(pkgPath)) return { found: false, version: null }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as Record<string, unknown>
    const deps = {
      ...(pkg['dependencies'] as Record<string, string> | undefined ?? {}),
      ...(pkg['devDependencies'] as Record<string, string> | undefined ?? {}),
    }
    const version = deps['next'] ?? null
    return { found: version !== null, version }
  } catch {
    return { found: false, version: null }
  }
}
