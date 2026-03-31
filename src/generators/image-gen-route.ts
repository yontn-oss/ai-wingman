import type { ImageGenConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { injectAuth } from './stubs.js'
import { MAX_DURATION_HEAVY } from '../defaults.js'

export function generateImageGenRoute(config: ImageGenConfig): string {
  let t = read('image-gen-route.ts')
  t = render(t, {
    __MAX_DURATION__: MAX_DURATION_HEAVY,
    __IMAGE_MODEL__: config.imageModel,
  })
  t = injectAuth(t, config.auth, config.pathAlias)
  return t
}
