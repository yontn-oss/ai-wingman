import fs from 'node:fs'
import path from 'node:path'

export function detectShadcn(targetDir: string): boolean {
  return fs.existsSync(path.join(targetDir, 'components.json'))
}
