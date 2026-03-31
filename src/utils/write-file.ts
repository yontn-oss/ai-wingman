import fs from 'node:fs'
import path from 'node:path'
import * as clack from '@clack/prompts'

export function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

export function createWriter(targetDir: string): (relPath: string) => (content: string) => void {
  return (relPath) => (content) => {
    writeFile(path.join(targetDir, relPath), content)
    clack.log.success(`Created ${relPath}`)
  }
}
