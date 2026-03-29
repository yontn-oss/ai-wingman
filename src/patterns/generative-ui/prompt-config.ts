import * as clack from '@clack/prompts'
import process from 'node:process'
import { promptPath } from '../../utils/prompt-path.js'
import type { GenerativeUiConfig, SharedConfig } from '../../types.js'

interface AddGenerativeUiOptions {
  routePath?: string
  pagePath?: string
  auth?: boolean
  overwrite?: boolean
  yes?: boolean
}

export async function promptGenerativeUiConfig(
  shared: SharedConfig,
  opts: AddGenerativeUiOptions = {}
): Promise<GenerativeUiConfig> {
  const { pathAlias, hasSrcDir, targetDir, packageManager } = shared
  const src = hasSrcDir ? 'src/' : ''

  // API route
  const routeResult = await promptPath(
    'API route output path',
    `${src}app/api/generative-ui/route.ts`,
    targetDir,
    { ...(opts.routePath && { prefill: opts.routePath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  // Page component
  const pageResult = await promptPath(
    'Page component output path',
    `${src}app/generative-ui/page.tsx`,
    targetDir,
    { ...(opts.pagePath && { prefill: opts.pagePath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  // Auth
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
      apiRoute: routeResult.value,
      page: pageResult.value,
    },
    pathOverwrites: {
      ...(routeResult.overwrite && { apiRoute: true }),
      ...(pageResult.overwrite && { page: true }),
    },
    provider: shared.provider,
    pathAlias,
    hasSrcDir,
    packageManager,
    targetDir,
  }
}
