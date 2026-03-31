import type { ContentModerationConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'
import { injectAuth } from './stubs.js'
import { MAX_DURATION_STANDARD } from '../defaults.js'

export function generateContentModerationRoute(config: ContentModerationConfig): string {
  let t = read('content-moderation-route.ts')
  t = render(t, {
    __MAX_DURATION__: MAX_DURATION_STANDARD,
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __MODEL_FACTORY__: config.provider.modelFactory,
    __POLICY_IMPORT_PATH__: toImportPath(config.paths.policy, config.pathAlias),
  })
  t = injectAuth(t, config.auth, config.pathAlias)
  return t
}
