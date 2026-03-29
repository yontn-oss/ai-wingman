import type { ImageGenConfig } from '../types.js'
import { read, render, inject } from '../utils/template.js'
import { authStub } from './stubs.js'
import { MAX_DURATION_HEAVY } from '../defaults.js'

export function generateImageGenRoute(config: ImageGenConfig): string {
  let t = read('image-gen-route.ts')
  t = render(t, {
    __MAX_DURATION__: MAX_DURATION_HEAVY,
    __IMAGE_MODEL__: config.imageModel,
  })
  t = inject(t, 'AUTH_IMPORT', config.auth ? `import { auth } from '${config.pathAlias}auth'` : '')
  t = inject(t, 'AUTH_CHECK', config.auth
    ? `  const session = await auth()\n  if (!session) return new Response('Unauthorized', { status: 401 })`
    : authStub(config.pathAlias)
  )
  return t
}
