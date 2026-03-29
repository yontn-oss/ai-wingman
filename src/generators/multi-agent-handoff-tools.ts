import type { MultiAgentConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'

export function generateMultiAgentHandoffTools(config: MultiAgentConfig): string {
  let t = read('multi-agent-handoff-tools.ts')
  t = render(t, {
    __SPECIALISTS_IMPORT_PATH__: toImportPath(config.paths.specialists, config.pathAlias),
    __TYPES_IMPORT_PATH__: toImportPath(config.paths.types, config.pathAlias),
  })
  return t
}
