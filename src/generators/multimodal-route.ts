import type { MultimodalConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { injectAuth } from './stubs.js'
import { MAX_DURATION_STANDARD } from '../defaults.js'

export function generateMultimodalRoute(config: MultimodalConfig): string {
  let t = read('multimodal-route.ts')
  t = render(t, {
    __MAX_DURATION__: MAX_DURATION_STANDARD,
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __MODEL_FACTORY__: config.provider.modelFactory,
  })
  t = injectAuth(t, config.auth, config.pathAlias)
  return t
}
