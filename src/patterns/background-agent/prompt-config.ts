import * as clack from '@clack/prompts'
import process from 'node:process'
import { promptPath } from '../../utils/prompt-path.js'
import type { BackgroundAgentConfig, SharedConfig } from '../../types.js'

interface AddBackgroundAgentOptions {
  apiRoute?: string
  auth?: boolean
  overwrite?: boolean
  yes?: boolean
}

export async function promptBackgroundAgentConfig(
  shared: SharedConfig,
  opts: AddBackgroundAgentOptions = {}
): Promise<BackgroundAgentConfig> {
  const { pathAlias, hasSrcDir, packageManager, targetDir } = shared
  const src = hasSrcDir ? 'src/' : ''

  const enqueueRouteResult = await promptPath(
    'Enqueue route output path',
    `${src}app/api/background-agent/enqueue/route.ts`,
    targetDir,
    { ...(opts.apiRoute && { prefill: opts.apiRoute }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  const statusRouteResult = await promptPath(
    'Status route output path',
    `${src}app/api/background-agent/status/[jobId]/route.ts`,
    targetDir,
    { ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  const workerResult = await promptPath(
    'Worker file output path',
    `${src}lib/background-agent/worker.ts`,
    targetDir,
    { ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  const jobStoreResult = await promptPath(
    'Job store file output path',
    `${src}lib/background-agent/job-store.ts`,
    targetDir,
    { ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

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
      enqueueRoute: enqueueRouteResult.value,
      statusRoute: statusRouteResult.value,
      worker: workerResult.value,
      jobStore: jobStoreResult.value,
    },
    pathOverwrites: {
      ...(enqueueRouteResult.overwrite && { enqueueRoute: true }),
      ...(statusRouteResult.overwrite && { statusRoute: true }),
      ...(workerResult.overwrite && { worker: true }),
      ...(jobStoreResult.overwrite && { jobStore: true }),
    },
    provider: shared.provider,
    pathAlias,
    hasSrcDir,
    packageManager,
    targetDir,
  }
}
