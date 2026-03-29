import fs from 'node:fs'
import path from 'node:path'

export function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}
