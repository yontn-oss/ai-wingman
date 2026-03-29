import fs from 'node:fs'
import path from 'node:path'

export function detectTypescript(targetDir: string): boolean {
  return fs.existsSync(path.join(targetDir, 'tsconfig.json'))
}
