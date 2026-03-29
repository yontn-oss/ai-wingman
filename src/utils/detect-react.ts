import fs from 'node:fs'
import path from 'node:path'

export function detectReact(targetDir: string): boolean {
  const pkgPath = path.join(targetDir, 'package.json')
  if (!fs.existsSync(pkgPath)) return false

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as Record<string, unknown>
    const deps = {
      ...(pkg['dependencies'] as Record<string, string> | undefined ?? {}),
      ...(pkg['devDependencies'] as Record<string, string> | undefined ?? {}),
    }
    return 'react' in deps && 'react-dom' in deps
  } catch {
    return false
  }
}
