import * as clack from '@clack/prompts'
import process from 'node:process'
import { promptPath } from '../../utils/prompt-path.js'
import type { MultiAgentConfig, SharedConfig } from '../../types.js'

interface AddMultiAgentOptions {
  apiRoute?: string
  auth?: boolean
  overwrite?: boolean
  yes?: boolean
}

export async function promptMultiAgentConfig(
  shared: SharedConfig,
  opts: AddMultiAgentOptions = {}
): Promise<MultiAgentConfig> {
  const { pathAlias, hasSrcDir, packageManager, targetDir } = shared
  const src = hasSrcDir ? 'src/' : ''

  const apiRouteResult = await promptPath(
    'Orchestrator route output path',
    `${src}app/api/multi-agent/route.ts`,
    targetDir,
    { ...(opts.apiRoute && { prefill: opts.apiRoute }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  const specialistsResult = await promptPath(
    'Specialists file output path',
    `${src}lib/multi-agent/specialists.ts`,
    targetDir,
    { ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  const handoffToolsResult = await promptPath(
    'Handoff tools file output path',
    `${src}lib/multi-agent/handoff-tools.ts`,
    targetDir,
    { ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  const typesResult = await promptPath(
    'Shared types file output path',
    `${src}lib/multi-agent/types.ts`,
    targetDir,
    { ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  let auth = false
  if (opts.auth !== undefined) {
    auth = opts.auth
  } else if (!opts.yes) {
    const wantsAuth = await clack.confirm({
      message: 'Add NextAuth v5 authentication?',
      initialValue: false,
    })
    if (clack.isCancel(wantsAuth)) { clack.cancel('Cancelled.'); process.exit(0) }
    auth = wantsAuth === true
  }

  return {
    auth,
    paths: {
      apiRoute: apiRouteResult.value,
      specialists: specialistsResult.value,
      handoffTools: handoffToolsResult.value,
      types: typesResult.value,
    },
    pathOverwrites: {
      ...(apiRouteResult.overwrite && { apiRoute: true }),
      ...(specialistsResult.overwrite && { specialists: true }),
      ...(handoffToolsResult.overwrite && { handoffTools: true }),
      ...(typesResult.overwrite && { types: true }),
    },
    provider: shared.provider,
    pathAlias,
    hasSrcDir,
    packageManager,
    targetDir,
  }
}
