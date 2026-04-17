import * as clack from '@clack/prompts'
import process from 'node:process'
import { promptPath } from '../../utils/prompt-path.js'
import type { AddChatOptions, McpAppConfig, SharedConfig } from '../../types.js'

type AddMcpAppOptions = Pick<AddChatOptions, 'appName' | 'apiRoute' | 'uiBundle' | 'state' | 'statePath' | 'auth' | 'overwrite' | 'yes'>

/** kebab-case → snake_case: "my-app" → "my_app" */
function toSnakeCase(kebab: string): string {
  return kebab.replace(/-/g, '_')
}

/** kebab-case → PascalCase: "my-app" → "MyApp" */
function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

export async function promptMcpAppConfig(
  shared: SharedConfig,
  opts: AddMcpAppOptions = {}
): Promise<McpAppConfig> {
  const { pathAlias, hasSrcDir, targetDir } = shared
  const src = hasSrcDir ? 'src/' : ''

  // App name
  let appName = 'my-app'
  if (opts.appName) {
    appName = opts.appName
  } else if (!opts.yes) {
    const input = await clack.text({
      message: 'App name (kebab-case)?',
      initialValue: 'my-app',
      validate(value) {
        if (!value?.trim()) return 'App name is required'
        if (!/^[a-z][a-z0-9-]*$/.test(value.trim())) return 'Use kebab-case (e.g. my-app, product-catalog)'
        return undefined
      },
    })
    if (clack.isCancel(input)) { clack.cancel('Cancelled.'); process.exit(0) }
    appName = String(input).trim()
  }

  const appNameSnake = toSnakeCase(appName)
  const appNamePascal = toPascalCase(appName)

  // API route path — uses {src} prefix like all other patterns
  const apiRouteResult = await promptPath(
    'API route output path',
    `${src}app/api/mcp/route.ts`,
    targetDir,
    { ...(opts.apiRoute && { prefill: opts.apiRoute }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  // UI bundle path — public/ is always at project root, never under src/
  const uiBundleResult = await promptPath(
    'UI bundle output path',
    `public/mcp-apps/${appName}/index.html`,
    targetDir,
    { ...(opts.uiBundle && { prefill: opts.uiBundle }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  // State store
  let includeState = true
  if (opts.state !== undefined) {
    includeState = opts.state
  } else if (!opts.yes) {
    const wantsState = await clack.confirm({
      message: 'Include in-memory state store?',
      initialValue: true,
    })
    if (clack.isCancel(wantsState)) { clack.cancel('Cancelled.'); process.exit(0) }
    includeState = wantsState === true
  }

  let statePath: string | undefined
  if (includeState) {
    const stateResult = await promptPath(
      'State module output path',
      `${src}lib/mcp-${appName}-state.ts`,
      targetDir,
      { ...(opts.statePath && { prefill: opts.statePath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
    )
    if (!stateResult.skip) {
      statePath = stateResult.value
    } else {
      includeState = false
    }
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
    appName,
    appNameSnake,
    appNamePascal,
    auth,
    includeState,
    paths: {
      apiRoute: apiRouteResult.value,
      uiBundle: uiBundleResult.value,
      ...(statePath !== undefined && { state: statePath }),
    },
    pathOverwrites: {
      ...(apiRouteResult.overwrite && { apiRoute: true }),
      ...(uiBundleResult.overwrite && { uiBundle: true }),
    },
    pathAlias,
    targetDir,
  }
}
