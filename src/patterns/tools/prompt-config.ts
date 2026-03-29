import * as clack from '@clack/prompts'
import process from 'node:process'
import { promptPath } from '../../utils/prompt-path.js'
import type { SharedConfig, ToolsConfig } from '../../types.js'

interface AddToolsOptions {
  toolName?: string
  apiRoute?: string
  toolsPath?: string
  auth?: boolean
  overwrite?: boolean
  yes?: boolean
}

function toKebabCase(camel: string): string {
  return camel.replace(/([A-Z])/g, '-$1').toLowerCase()
}

export async function promptToolsConfig(
  shared: SharedConfig,
  opts: AddToolsOptions = {}
): Promise<ToolsConfig> {
  const { pathAlias, hasSrcDir, targetDir } = shared
  const src = hasSrcDir ? 'src/' : ''

  // Tool name
  let toolName = 'myTool'
  if (opts.toolName) {
    toolName = opts.toolName
  } else if (!opts.yes) {
    const input = await clack.text({
      message: 'Tool name?',
      initialValue: 'myTool',
      validate(value) {
        if (!value?.trim()) return 'Tool name is required'
        if (!/^[a-z][a-zA-Z0-9]*$/.test(value.trim())) return 'Use camelCase (e.g. searchWeb, fetchWeather)'
        return undefined
      },
    })
    if (clack.isCancel(input)) { clack.cancel('Cancelled.'); process.exit(0) }
    toolName = String(input).trim()
  }

  // API route path
  const apiRouteResult = await promptPath(
    'API route output path',
    `${src}app/api/tools/route.ts`,
    targetDir,
    { ...(opts.apiRoute && { prefill: opts.apiRoute }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  // Tools file path
  const toolsFileResult = await promptPath(
    'Tools file output path',
    `${src}lib/tools/${toKebabCase(toolName)}.tools.ts`,
    targetDir,
    { ...(opts.toolsPath && { prefill: opts.toolsPath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
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
    toolName,
    auth,
    paths: {
      apiRoute: apiRouteResult.value,
      toolsFile: toolsFileResult.value,
    },
    pathOverwrites: {
      ...(apiRouteResult.overwrite && { apiRoute: true }),
      ...(toolsFileResult.overwrite && { toolsFile: true }),
    },
    provider: shared.provider,
    pathAlias,
    targetDir,
  }
}
