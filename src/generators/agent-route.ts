import type { AgentConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'
import { injectAuth } from './stubs.js'
import { MAX_DURATION_HEAVY, MAX_STEPS_AGENT } from '../defaults.js'

export function generateAgentRoute(config: AgentConfig): string {
  const toolsVarName = `${config.agentName}Tools`
  let t = read('agent-route.ts')
  t = render(t, {
    __MAX_DURATION__: MAX_DURATION_HEAVY,
    __MAX_STEPS__: MAX_STEPS_AGENT,
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __MODEL_FACTORY__: config.provider.modelFactory,
    __TOOLS_VAR_NAME__: toolsVarName,
    __TOOLS_IMPORT_PATH__: toImportPath(config.paths.toolsFile, config.pathAlias),
    __STORAGE_IMPORT_PATH__: toImportPath(config.paths.storage, config.pathAlias),
  })
  t = injectAuth(t, config.auth, config.pathAlias)
  return t
}
