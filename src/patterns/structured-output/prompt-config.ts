import * as clack from '@clack/prompts'
import process from 'node:process'
import { promptPath } from '../../utils/prompt-path.js'
import type { AddChatOptions, SharedConfig, StructuredOutputConfig } from '../../types.js'

export async function promptStructuredOutputConfig(
  shared: SharedConfig,
  opts: AddChatOptions = {}
): Promise<StructuredOutputConfig> {
  const { pathAlias, hasSrcDir, targetDir } = shared
  const src = hasSrcDir ? 'src/' : ''

  // Schema name
  let schemaName = 'output'
  if (opts.schemaName) {
    schemaName = opts.schemaName
  } else if (!opts.yes) {
    const input = await clack.text({
      message: 'Schema name?',
      initialValue: 'output',
      validate(value) {
        if (!value?.trim()) return 'Schema name is required'
        if (!/^[a-z][a-zA-Z0-9]*$/.test(value.trim())) return 'Use camelCase (e.g. output, filterResult)'
        return undefined
      },
    })
    if (clack.isCancel(input)) { clack.cancel('Cancelled.'); process.exit(0) }
    schemaName = String(input).trim()
  }

  // API route path
  const apiRouteResult = await promptPath(
    'API route output path',
    `${src}app/api/structured-output/route.ts`,
    targetDir,
    { ...(opts.apiRoute && { prefill: opts.apiRoute }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  // Schema path
  const schemaResult = await promptPath(
    'Schema output path',
    `${src}lib/schemas/${schemaName}.schema.ts`,
    targetDir,
    { ...(opts.schemaPath && { prefill: opts.schemaPath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  const paths: StructuredOutputConfig['paths'] = {
    apiRoute: apiRouteResult.value,
    schema: schemaResult.value,
  }
  const pathOverwrites: StructuredOutputConfig['pathOverwrites'] = {
    ...(apiRouteResult.overwrite && { apiRoute: true }),
    ...(schemaResult.overwrite && { schema: true }),
  }

  // Hook (opt-in, default: included)
  const includeHook = opts.hook !== false
  if (includeHook && !apiRouteResult.skip) {
    const hookResult = await promptPath(
      'Hook output path',
      `${src}hooks/use-${schemaName}.ts`,
      targetDir,
      { ...(opts.hookPath && { prefill: opts.hookPath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
    )
    if (!hookResult.skip) {
      paths.hook = hookResult.value
      if (hookResult.overwrite) pathOverwrites.hook = true
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
    schemaName,
    auth,
    paths,
    pathOverwrites,
    provider: shared.provider,
    pathAlias,
    targetDir,
  }
}
