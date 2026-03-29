import * as clack from '@clack/prompts'
import process from 'node:process'
import { getRegistry } from '../../registry/index.js'
import { resolvePatterns } from '../../registry/patterns.js'
import { detectPrerequisites } from '../../steps/detect-prerequisites.js'
import { announcePlan } from '../../steps/announce-plan.js'
import { buildPlan } from '../../planner/index.js'
import { detectPathAlias } from '../../utils/detect-path-alias.js'
import { detectPackageManager, installArgs } from '../../utils/detect-package-manager.js'
import { spawnSilent, ExitError } from '../../utils/spawn.js'
import type { Command } from 'commander'
import type { AddChatOptions, SharedConfig } from '../../types.js'
import { validateFlags } from '../../utils/validate-flags.js'

async function promptSharedConfig(
  targetDir: string,
  opts: AddChatOptions,
  prereqs: { hasShadcn: boolean; hasNext: boolean }
): Promise<SharedConfig> {
  const registry = getRegistry()
  const { prefix: pathAlias, hasSrcDir } = detectPathAlias(targetDir)
  const packageManager = detectPackageManager(targetDir)

  if (opts.provider !== undefined) {
    const valid = registry.providers.map((p) => p.id)
    if (!valid.includes(opts.provider as never)) {
      clack.log.error(`Unknown provider "${opts.provider}". Valid values: ${valid.join(', ')}`)
      process.exit(1)
    }
  }

  let provider = registry.providers[0]!
  if (opts.provider) {
    provider = registry.providers.find((p) => p.id === opts.provider)!
  } else if (!opts.yes) {
    const providerId = await clack.select({
      message: 'AI provider?',
      options: registry.providers.map((p) => ({ value: p.id, label: p.label })),
    })
    if (clack.isCancel(providerId)) { clack.cancel('Cancelled.'); process.exit(0) }
    provider = registry.providers.find((p) => p.id === providerId)!
  }

  return { provider, pathAlias, hasSrcDir, packageManager, targetDir, prereqs }
}

export async function addCommand(patternId: string, opts: AddChatOptions, command: Command): Promise<void> {
  const targetDir = process.cwd()

  clack.intro('ai-wingman')

  const prereqs = await detectPrerequisites(targetDir)

  let patterns
  try {
    patterns = resolvePatterns([patternId])
  } catch (err) {
    clack.log.error((err as Error).message)
    process.exit(1)
  }

  // We only support one pattern at a time
  const [pattern] = patterns

  const invalidFlags = validateFlags(pattern!, command)
  if (invalidFlags.length > 0) {
    clack.log.warn(
      `${invalidFlags.join(', ')} ${invalidFlags.length === 1 ? 'is' : 'are'} not used by the "${patternId}" pattern and will be ignored`
    )
  }
  const shared = await promptSharedConfig(targetDir, opts, prereqs)
  const config = await pattern!.promptConfig(shared, opts)

  const plan = buildPlan([{ pattern: pattern!, config }])
  await announcePlan(plan, opts)

  const pm = shared.packageManager
  for (const pkg of plan.packages) {
    const spinner = clack.spinner()
    spinner.start(`Installing ${pkg}...`)
    try {
      await spawnSilent(pm, installArgs(pm, pkg), targetDir)
      spinner.stop(`Installed ${pkg}`)
    } catch (err) {
      spinner.stop(`Failed to install ${pkg}`)
      if (err instanceof ExitError) {
        clack.log.warn(`Install manually: ${pm} ${installArgs(pm, pkg).join(' ')}`)
      }
    }
  }

  await pattern!.execute(config, shared)

  const envVars = pattern!.getEnvVars(config)
  if (envVars.length > 0) {
    clack.note(envVars.map((v) => `${v}=`).join('\n'), 'Add these to your .env.local')
  }

  clack.outro(`Done! Start your dev server: ${pm} run dev`)
}
