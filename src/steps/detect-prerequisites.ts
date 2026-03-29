import * as clack from '@clack/prompts'
import process from 'node:process'
import { detectNext } from '../utils/detect-next.js'
import { detectReact } from '../utils/detect-react.js'
import { detectShadcn } from '../utils/detect-shadcn.js'
import { detectTypescript } from '../utils/detect-typescript.js'

export interface Prerequisites {
  hasShadcn: boolean
  hasNext: boolean
}

export async function detectPrerequisites(targetDir: string): Promise<Prerequisites> {
  if (!detectReact(targetDir)) {
    clack.log.error('react and react-dom not found in package.json. This tool requires React.')
    process.exit(1)
  }

  if (!detectTypescript(targetDir)) {
    clack.log.error('No tsconfig.json found. This tool requires TypeScript.')
    process.exit(1)
  }

  const next = detectNext(targetDir)
  if (next.found) {
    clack.log.success(`Next.js ${next.version ?? ''} found`)
  }

  return { hasShadcn: detectShadcn(targetDir), hasNext: next.found }
}
