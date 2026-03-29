import * as clack from '@clack/prompts'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { promptPath } from '../../utils/prompt-path.js'
import type { SharedConfig, StreamObjectConfig } from '../../types.js'

interface AddStreamObjectOptions {
  schemaName?: string
  apiRoute?: string
  schemaPath?: string
  hookPath?: string
  hook?: boolean
  auth?: boolean
  overwrite?: boolean
  yes?: boolean
}

export async function promptStreamObjectConfig(
  shared: SharedConfig,
  opts: AddStreamObjectOptions = {}
): Promise<StreamObjectConfig> {
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
        if (!/^[a-z][a-zA-Z0-9]*$/.test(value.trim())) return 'Use camelCase (e.g. product, filterResult)'
        return undefined
      },
    })
    if (clack.isCancel(input)) { clack.cancel('Cancelled.'); process.exit(0) }
    schemaName = String(input).trim()
  }

  // API route path
  const apiRouteResult = await promptPath(
    'API route output path',
    `${src}app/api/stream-object/route.ts`,
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

  // Check if schema already exists (before any writing)
  const schemaAbsPath = path.join(targetDir, schemaResult.value)
  const schemaAlreadyExists = fs.existsSync(schemaAbsPath) && !schemaResult.overwrite
  if (schemaAlreadyExists) {
    clack.log.info(`Schema file already exists — skipping write. Using existing schema at ${schemaResult.value}.`)
  }

  const paths: StreamObjectConfig['paths'] = {
    apiRoute: apiRouteResult.value,
    schema: schemaResult.value,
  }
  const pathOverwrites: StreamObjectConfig['pathOverwrites'] = {
    ...(apiRouteResult.overwrite && { apiRoute: true }),
    ...(schemaResult.overwrite && { schema: true }),
  }

  // Hook (optional, default: included)
  const includeHook = opts.hook !== false
  if (includeHook) {
    const hookResult = await promptPath(
      'Hook output path',
      `${src}hooks/use-${schemaName}-stream.ts`,
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
    schemaAlreadyExists,
    provider: shared.provider,
    pathAlias,
    targetDir,
  }
}
