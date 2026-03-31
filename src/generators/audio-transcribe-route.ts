import type { AudioConfig } from '../types.js'
import { read, render } from '../utils/template.js'
import { transcriptionCallExpr } from '../utils/provider-call-expr.js'
import { injectAuth } from './stubs.js'
import { MAX_DURATION_STANDARD } from '../defaults.js'

export function generateAudioTranscribeRoute(config: AudioConfig): string {
  let t = read('audio-transcribe-route.ts')
  t = render(t, {
    __MAX_DURATION__: MAX_DURATION_STANDARD,
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __TRANSCRIPTION_CALL_EXPR__: transcriptionCallExpr(config.provider),
  })
  t = injectAuth(t, config.auth, config.pathAlias)
  return t
}
