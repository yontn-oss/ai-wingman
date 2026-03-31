import * as clack from '@clack/prompts'
import process from 'node:process'
import { promptPath } from '../../utils/prompt-path.js'
import type { DocumentProcessingConfig, SharedConfig } from '../../types.js'

interface AddDocumentProcessingOptions {
  schemaName?: string
  apiRoute?: string
  schemaPath?: string
  hookPath?: string
  hook?: boolean
  auth?: boolean
  overwrite?: boolean
  yes?: boolean
}

export async function promptDocumentProcessingConfig(
  shared: SharedConfig,
  opts: AddDocumentProcessingOptions = {}
): Promise<DocumentProcessingConfig> {
  const { pathAlias, hasSrcDir, targetDir } = shared
  const src = hasSrcDir ? 'src/' : ''

  // Schema name
  let schemaName = opts.schemaName ?? ''
  if (!schemaName && !opts.yes) {
    const input = await clack.text({
      message: 'Schema / type name (used for the Zod schema and TypeScript type)',
      placeholder: 'document',
      validate: (v) => (v?.trim() ? undefined : 'Required'),
    })
    if (clack.isCancel(input)) { clack.cancel('Cancelled.'); process.exit(0) }
    schemaName = (input as string).trim() || 'document'
  }
  if (!schemaName) schemaName = 'document'

  // API route
  const apiRouteResult = await promptPath(
    'API route output path',
    `${src}app/api/document-processing/route.ts`,
    targetDir,
    { ...(opts.apiRoute && { prefill: opts.apiRoute }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  // Schema file
  const schemaResult = await promptPath(
    'Schema file output path',
    `${src}lib/schemas/${schemaName}.schema.ts`,
    targetDir,
    { ...(opts.schemaPath && { prefill: opts.schemaPath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  // Hook
  let includeHook = true
  if (opts.hook !== undefined) {
    includeHook = opts.hook
  } else if (!opts.yes) {
    const wantsHook = await clack.confirm({
      message: 'Generate a client hook (useExtract)?',
      initialValue: true,
    })
    if (clack.isCancel(wantsHook)) { clack.cancel('Cancelled.'); process.exit(0) }
    includeHook = wantsHook === true
  }

  let hookResult: { value: string; overwrite?: boolean } | null = null
  if (includeHook) {
    hookResult = await promptPath(
      'Hook output path',
      `${src}hooks/use-${schemaName}-extract.ts`,
      targetDir,
      { ...(opts.hookPath && { prefill: opts.hookPath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
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
    schemaName,
    auth,
    paths: {
      apiRoute: apiRouteResult.value,
      schema: schemaResult.value,
      ...(hookResult && { hook: hookResult.value }),
    },
    pathOverwrites: {
      ...(apiRouteResult.overwrite && { apiRoute: true }),
      ...(schemaResult.overwrite && { schema: true }),
      ...(hookResult?.overwrite && { hook: true }),
    },
    provider: shared.provider,
    pathAlias,
    targetDir,
  }
}
