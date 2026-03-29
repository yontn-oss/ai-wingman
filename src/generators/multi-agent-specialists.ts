import type { MultiAgentConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'

export function generateMultiAgentSpecialists(config: MultiAgentConfig): string {
  let t = read('multi-agent-specialists.ts')
  t = render(t, {
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __MODEL_FACTORY__: config.provider.modelFactory,
    __TYPES_IMPORT_PATH__: toImportPath(config.paths.types, config.pathAlias),
  })
  return t
}
