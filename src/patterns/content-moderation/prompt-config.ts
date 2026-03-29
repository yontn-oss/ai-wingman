import * as clack from '@clack/prompts'
import process from 'node:process'
import { promptPath } from '../../utils/prompt-path.js'
import type { ContentModerationConfig, SharedConfig } from '../../types.js'

interface AddContentModerationOptions {
  apiRoute?: string
  policyPath?: string
  auth?: boolean
  overwrite?: boolean
  yes?: boolean
}

export async function promptContentModerationConfig(
  shared: SharedConfig,
  opts: AddContentModerationOptions = {}
): Promise<ContentModerationConfig> {
  const { pathAlias, hasSrcDir, targetDir } = shared
  const src = hasSrcDir ? 'src/' : ''

  const apiRouteResult = await promptPath(
    'API route output path',
    `${src}app/api/content-moderation/route.ts`,
    targetDir,
    { ...(opts.apiRoute && { prefill: opts.apiRoute }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  const policyResult = await promptPath(
    'Policy config output path',
    `${src}lib/moderation/policy.ts`,
    targetDir,
    { ...(opts.policyPath && { prefill: opts.policyPath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
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
      policy: policyResult.value,
    },
    pathOverwrites: {
      ...(apiRouteResult.overwrite && { apiRoute: true }),
      ...(policyResult.overwrite && { policy: true }),
    },
    provider: shared.provider,
    pathAlias,
    targetDir,
  }
}
