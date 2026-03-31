import type { AudioConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { speechCallExpr } from '../utils/provider-call-expr.js'
import { injectAuth } from './stubs.js'
import { MAX_DURATION_STANDARD } from '../defaults.js'

export function generateAudioSpeechRoute(config: AudioConfig): string {
  let t = read('audio-speech-route.ts')
  t = render(t, {
    __MAX_DURATION__: MAX_DURATION_STANDARD,
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __SPEECH_CALL_EXPR__: speechCallExpr(config.provider),
  })
  t = injectAuth(t, config.auth, config.pathAlias)
  return t
}
