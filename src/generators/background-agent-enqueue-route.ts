import type { BackgroundAgentConfig } from '../types.js'
import { read, render, inject } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'
import { authStub } from './stubs.js'

export function generateBackgroundAgentEnqueueRoute(config: BackgroundAgentConfig): string {
  let t = read('background-agent-enqueue-route.ts')
  t = render(t, {
    __JOB_STORE_IMPORT_PATH__: toImportPath(config.paths.jobStore, config.pathAlias),
    __WORKER_IMPORT_PATH__: toImportPath(config.paths.worker, config.pathAlias),
  })
  t = inject(t, 'AUTH_IMPORT', config.auth ? `import { auth } from '${config.pathAlias}auth'` : '')
  t = inject(t, 'AUTH_CHECK', config.auth
    ? `  const session = await auth()\n  if (!session) return new Response('Unauthorized', { status: 401 })`
    : authStub(config.pathAlias)
  )
  return t
}
