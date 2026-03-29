import * as clack from '@clack/prompts'
import { spawnCommand, ExitError } from '../utils/spawn.js'

export function buildShadcnArgs(components: string[], extraArgs: string[] = []): [string, string[]] {
  return ['npx', ['shadcn@latest', 'add', ...components, '--overwrite', ...extraArgs]]
}

export async function runShadcn(targetDir: string, components: string[]): Promise<void> {
  if (components.length === 0) return

  const [cmd, args] = buildShadcnArgs(components)
  clack.log.step('Running shadcn add...')
  try {
    await spawnCommand(cmd, args, targetDir)
    clack.log.success('shadcn done')
  } catch (err) {
    clack.log.error('shadcn add failed')
    if (err instanceof ExitError) {
      clack.log.warn(
        `shadcn exited with code ${err.code}. Run manually: npx shadcn@latest add ${components.join(' ')}`
      )
    }
  }
}
