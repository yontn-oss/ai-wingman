import type { BackgroundAgentConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'
import { injectAuth } from './stubs.js'

export function generateBackgroundAgentStatusRoute(config: BackgroundAgentConfig): string {
  let t = read('background-agent-status-route.ts')
  t = render(t, {
    __JOB_STORE_IMPORT_PATH__: toImportPath(config.paths.jobStore, config.pathAlias),
  })
  t = injectAuth(t, config.auth, config.pathAlias)
  return t
}
