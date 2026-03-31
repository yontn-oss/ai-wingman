import type { EvalConfig } from '../types.js'
import { read, render } from '../utils/template.js'

export function generateEvalScript(config: EvalConfig): string {
  const t = read('eval-script.ts')
  return render(t, {
    __SCRIPT_PATH__: config.paths.evalScript!,
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __MODEL_FACTORY__: config.provider.modelFactory,
  })
}
