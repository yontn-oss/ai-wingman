import type { GenerativeUiConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { injectAuth } from './stubs.js'

export function generateGenerativeUiRoute(config: GenerativeUiConfig): string {
  let t = read('generative-ui-route.ts')
  t = render(t, {
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __MODEL_FACTORY__: config.provider.modelFactory,
  })
  t = injectAuth(t, config.auth, config.pathAlias)
  return t
}
