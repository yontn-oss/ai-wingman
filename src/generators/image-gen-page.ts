import type { ImageGenConfig } from '../types.js'
import { read, render } from '../utils/template.js'

function deriveApiPath(outputPath: string): string {
  return '/' + outputPath
    .replace(/^src\//, '')
    .replace(/^app\//, '')
    .replace(/\/route\.tsx?$/, '')
}

export function generateImageGenPage(config: ImageGenConfig): string {
  let t = read('image-gen-page.tsx')
  t = render(t, {
    __PATH_ALIAS__: config.pathAlias,
    __API_PATH__: deriveApiPath(config.paths.apiRoute),
  })
  return t
}
