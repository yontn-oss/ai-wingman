import * as clack from '@clack/prompts'
import { spawnCommand, ExitError } from '../utils/spawn.js'

// ai-elements is a thin wrapper: `npx shadcn@latest add <registry-urls>`.
// It does NOT forward extra flags, so we call shadcn directly.
const REGISTRY_BASE = 'https://elements.ai-sdk.dev/api/registry/'

export const AI_ELEMENTS_COMPONENTS = [
  'conversation',
  'message',
  'suggestion',
  'prompt-input',
  'reasoning',
  'sources',
]

export function buildAiElementsArgs(extraArgs: string[] = []): [string, string[]] {
  const registryUrls = AI_ELEMENTS_COMPONENTS.map((c) => `${REGISTRY_BASE}${c}.json`)
  return ['npx', ['shadcn@latest', 'add', ...registryUrls, '--overwrite', ...extraArgs]]
}

export async function runAiElements(targetDir: string): Promise<void> {
  clack.log.step('Running ai-elements...')
  const [cmd, args] = buildAiElementsArgs()
  try {
    await spawnCommand(cmd, args, targetDir)
    clack.log.success('ai-elements done')
  } catch (err) {
    clack.log.error('ai-elements failed')
    if (err instanceof ExitError) {
      clack.log.warn(
        `ai-elements install failed with code ${err.code}. Run manually: npx ai-elements@latest add ${AI_ELEMENTS_COMPONENTS.join(' ')}`
      )
    }
  }
}
