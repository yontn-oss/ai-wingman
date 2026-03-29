import * as clack from '@clack/prompts'
import process from 'node:process'
import { promptPath } from '../../utils/prompt-path.js'
import type { MemoryConfig, SharedConfig } from '../../types.js'

interface AddMemoryOptions {
  embeddingModel?: string
  auth?: boolean
  overwrite?: boolean
  yes?: boolean
}

function defaultEmbeddingModel(providerId: string): string {
  if (providerId === 'openai') return 'text-embedding-3-small'
  if (providerId === 'google') return 'embedding-001'
  return 'voyage-3'
}

export async function promptMemoryConfig(
  shared: SharedConfig,
  opts: AddMemoryOptions = {}
): Promise<MemoryConfig> {
  const { pathAlias, hasSrcDir, targetDir } = shared
  const src = hasSrcDir ? 'src/' : ''

  const saveRouteResult = await promptPath(
    'Save route output path',
    `${src}app/api/memory/save/route.ts`,
    targetDir,
    { ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  const retrieveRouteResult = await promptPath(
    'Retrieve route output path',
    `${src}app/api/memory/retrieve/route.ts`,
    targetDir,
    { ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  const storeResult = await promptPath(
    'Memory store output path',
    `${src}lib/memory/store.ts`,
    targetDir,
    { ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  const injectResult = await promptPath(
    'Inject helper output path',
    `${src}lib/memory/inject.ts`,
    targetDir,
    { ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  let embeddingModel = defaultEmbeddingModel(shared.provider.id)
  if (opts.embeddingModel) {
    embeddingModel = opts.embeddingModel
  } else if (!opts.yes) {
    const input = await clack.text({
      message: 'Embedding model ID?',
      initialValue: embeddingModel,
    })
    if (clack.isCancel(input)) { clack.cancel('Cancelled.'); process.exit(0) }
    embeddingModel = String(input).trim() || embeddingModel
  }

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
    embeddingModel,
    auth,
    paths: {
      saveRoute: saveRouteResult.value,
      retrieveRoute: retrieveRouteResult.value,
      store: storeResult.value,
      inject: injectResult.value,
    },
    pathOverwrites: {
      ...(saveRouteResult.overwrite && { saveRoute: true }),
      ...(retrieveRouteResult.overwrite && { retrieveRoute: true }),
      ...(storeResult.overwrite && { store: true }),
      ...(injectResult.overwrite && { inject: true }),
    },
    provider: shared.provider,
    pathAlias,
    targetDir,
  }
}
