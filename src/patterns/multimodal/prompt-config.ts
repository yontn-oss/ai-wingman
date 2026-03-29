import * as clack from '@clack/prompts'
import process from 'node:process'
import { promptPath } from '../../utils/prompt-path.js'
import type { MultimodalConfig, SharedConfig } from '../../types.js'

interface AddMultimodalOptions {
  apiRoute?: string
  pagePath?: string
  page?: boolean
  auth?: boolean
  overwrite?: boolean
  yes?: boolean
}

export async function promptMultimodalConfig(
  shared: SharedConfig,
  opts: AddMultimodalOptions = {}
): Promise<MultimodalConfig> {
  const { pathAlias, hasSrcDir, targetDir, packageManager } = shared
  const src = hasSrcDir ? 'src/' : ''

  // API route path
  const apiRouteResult = await promptPath(
    'API route output path',
    `${src}app/api/multimodal/route.ts`,
    targetDir,
    { ...(opts.apiRoute && { prefill: opts.apiRoute }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  // Page component
  let includePage = true
  if (opts.page !== undefined) {
    includePage = opts.page
  } else if (!opts.yes) {
    const wantsPage = await clack.confirm({
      message: 'Generate a page component with file upload UI?',
      initialValue: true,
    })
    if (clack.isCancel(wantsPage)) { clack.cancel('Cancelled.'); process.exit(0) }
    includePage = wantsPage === true
  }

  let pageResult: { value: string; overwrite?: boolean } | null = null
  if (includePage) {
    pageResult = await promptPath(
      'Page component output path',
      `${src}app/multimodal/page.tsx`,
      targetDir,
      { ...(opts.pagePath && { prefill: opts.pagePath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
    )
  }

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
    includePage,
    paths: {
      apiRoute: apiRouteResult.value,
      ...(pageResult && { page: pageResult.value }),
    },
    pathOverwrites: {
      ...(apiRouteResult.overwrite && { apiRoute: true }),
      ...(pageResult?.overwrite && { page: true }),
    },
    provider: shared.provider,
    pathAlias,
    hasSrcDir,
    packageManager,
    targetDir,
  }
}
