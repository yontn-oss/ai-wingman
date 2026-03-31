import type { MultiAgentConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'
import { injectAuth } from './stubs.js'
import { MAX_DURATION_HEAVY, MAX_STEPS_MULTI_AGENT } from '../defaults.js'

export function generateMultiAgentOrchestratorRoute(config: MultiAgentConfig): string {
  let t = read('multi-agent-orchestrator-route.ts')
  t = render(t, {
    __MAX_DURATION__: MAX_DURATION_HEAVY,
    __MAX_STEPS__: MAX_STEPS_MULTI_AGENT,
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __MODEL_FACTORY__: config.provider.modelFactory,
    __HANDOFF_TOOLS_IMPORT_PATH__: toImportPath(config.paths.handoffTools, config.pathAlias),
  })
  t = injectAuth(t, config.auth, config.pathAlias)
  return t
}
