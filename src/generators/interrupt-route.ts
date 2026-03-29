import type { InterruptPatternConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'

export function generateInterruptRoute(config: InterruptPatternConfig): string {
  const t = read('interrupt-route.ts')
  return render(t, {
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __MODEL_FACTORY__: config.provider.modelFactory,
    __TOOLS_IMPORT_PATH__: toImportPath(config.paths.tools, config.pathAlias),
  })
}
