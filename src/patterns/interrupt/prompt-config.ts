import * as clack from '@clack/prompts'
import process from 'node:process'
import { promptPath } from '../../utils/prompt-path.js'
import type { InterruptPatternConfig, SharedConfig } from '../../types.js'

interface AddInterruptOptions {
  apiRoute?: string
  toolsPath?: string
  componentPath?: string
  pagePath?: string
  page?: boolean
  overwrite?: boolean
  yes?: boolean
}

export async function promptInterruptConfig(
  shared: SharedConfig,
  opts: AddInterruptOptions = {}
): Promise<InterruptPatternConfig> {
  const { pathAlias, hasSrcDir, packageManager, provider, targetDir } = shared
  const src = hasSrcDir ? 'src/' : ''

  const apiRouteResult = await promptPath(
    'API route output path',
    `${src}app/api/interrupt/route.ts`,
    targetDir,
    { ...(opts.apiRoute && { prefill: opts.apiRoute }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  const toolsResult = await promptPath(
    'Tools file output path',
    `${src}lib/interrupt-tools.ts`,
    targetDir,
    { ...(opts.toolsPath && { prefill: opts.toolsPath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  const componentResult = await promptPath(
    'Approval widget output path',
    `${src}components/approval-widget.tsx`,
    targetDir,
    { ...(opts.componentPath && { prefill: opts.componentPath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  const paths: InterruptPatternConfig['paths'] = {
    apiRoute: apiRouteResult.value,
    tools: toolsResult.value,
    component: componentResult.value,
  }
  const pathOverwrites: InterruptPatternConfig['pathOverwrites'] = {
    ...(apiRouteResult.overwrite && { apiRoute: true }),
    ...(toolsResult.overwrite && { tools: true }),
    ...(componentResult.overwrite && { component: true }),
  }

  // Page component (optional, default: included)
  let includePage = opts.page !== false
  if (includePage) {
    const pageResult = await promptPath(
      'Page component output path',
      `${src}app/interrupt/page.tsx`,
      targetDir,
      { ...(opts.pagePath && { prefill: opts.pagePath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
    )
    if (pageResult.skip) {
      includePage = false
    } else {
      paths.page = pageResult.value
      if (pageResult.overwrite) pathOverwrites.page = true
    }
  }

  return {
    provider,
    paths,
    pathOverwrites,
    includePage,
    pathAlias,
    hasSrcDir,
    packageManager,
    targetDir,
  }
}
