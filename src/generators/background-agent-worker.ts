import type { BackgroundAgentConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'

export function generateBackgroundAgentWorker(config: BackgroundAgentConfig): string {
  let t = read('background-agent-worker.ts')
  t = render(t, {
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __MODEL_FACTORY__: config.provider.modelFactory,
    __JOB_STORE_IMPORT_PATH__: toImportPath(config.paths.jobStore, config.pathAlias),
  })
  return t
}
