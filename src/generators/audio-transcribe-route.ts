import type { AudioConfig } from '../types.js'
import { read, render, inject } from '../utils/template.js'
import { transcriptionCallExpr } from '../utils/provider-call-expr.js'
import { authStub } from './stubs.js'
import { MAX_DURATION_STANDARD } from '../defaults.js'

export function generateAudioTranscribeRoute(config: AudioConfig): string {
  let t = read('audio-transcribe-route.ts')
  t = render(t, {
    __MAX_DURATION__: MAX_DURATION_STANDARD,
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __TRANSCRIPTION_CALL_EXPR__: transcriptionCallExpr(config.provider),
  })
  t = inject(t, 'AUTH_IMPORT', config.auth ? `import { auth } from '${config.pathAlias}auth'` : '')
  t = inject(t, 'AUTH_CHECK', config.auth
    ? `  const session = await auth()\n  if (!session) return new Response('Unauthorized', { status: 401 })`
    : authStub(config.pathAlias)
  )
  return t
}
