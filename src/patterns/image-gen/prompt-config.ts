import * as clack from '@clack/prompts'
import process from 'node:process'
import { promptPath } from '../../utils/prompt-path.js'
import type { ImageGenConfig, SharedConfig } from '../../types.js'

interface AddImageGenOptions {
  apiRoute?: string
  pagePath?: string
  page?: boolean
  auth?: boolean
  imageModel?: string
  overwrite?: boolean
  yes?: boolean
}

export async function promptImageGenConfig(
  shared: SharedConfig,
  opts: AddImageGenOptions = {}
): Promise<ImageGenConfig> {
  const { pathAlias, hasSrcDir, targetDir, packageManager } = shared
  const src = hasSrcDir ? 'src/' : ''

  // Image model selection
  let imageModel = opts.imageModel ?? ''
  if (!imageModel && !opts.yes) {
    const selected = await clack.select({
      message: 'Which OpenAI image model?',
      options: [
        { value: 'dall-e-3', label: 'DALL·E 3  (best quality, recommended)' },
        { value: 'dall-e-2', label: 'DALL·E 2  (faster, cheaper)' },
      ],
      initialValue: 'dall-e-3',
    })
    if (clack.isCancel(selected)) { clack.cancel('Cancelled.'); process.exit(0) }
    imageModel = selected as string
  }
  if (!imageModel) imageModel = 'dall-e-3'

  // API route path
  const apiRouteResult = await promptPath(
    'API route output path',
    `${src}app/api/image-gen/route.ts`,
    targetDir,
    { ...(opts.apiRoute && { prefill: opts.apiRoute }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  // Page component
  let includePage = true
  if (opts.page !== undefined) {
    includePage = opts.page
  } else if (!opts.yes) {
    const wantsPage = await clack.confirm({
      message: 'Generate a page with prompt input and image display?',
      initialValue: true,
    })
    if (clack.isCancel(wantsPage)) { clack.cancel('Cancelled.'); process.exit(0) }
    includePage = wantsPage === true
  }

  let pageResult: { value: string; overwrite?: boolean } | null = null
  if (includePage) {
    pageResult = await promptPath(
      'Page component output path',
      `${src}app/image-gen/page.tsx`,
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
    imageModel,
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
    pathAlias,
    hasSrcDir,
    packageManager,
    targetDir,
  }
}
