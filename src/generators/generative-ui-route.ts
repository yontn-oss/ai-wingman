import type { GenerativeUiConfig } from '../types.js'
import { read, render, inject } from '../utils/template.js'
import { authStub } from './stubs.js'

export function generateGenerativeUiRoute(config: GenerativeUiConfig): string {
  let t = read('generative-ui-route.ts')
  t = render(t, {
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __MODEL_FACTORY__: config.provider.modelFactory,
  })
  t = inject(t, 'AUTH_IMPORT', config.auth ? `import { auth } from '${config.pathAlias}auth'` : '')
  t = inject(t, 'AUTH_CHECK', config.auth
    ? `  const session = await auth()\n  if (!session) return new Response('Unauthorized', { status: 401 })`
    : authStub(config.pathAlias)
  )
  return t
}
