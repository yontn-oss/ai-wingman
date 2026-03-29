import type { ProviderEntry } from '../types.js'

/**
 * Returns a typed embedding model call expression, or falls back to an `as any`
 * cast for providers that lack a native embedding method.
 *
 * Example outputs:
 *   openai  → openai.embedding('text-embedding-3-small')
 *   google  → google.textEmbeddingModel('text-embedding-004')
 *   anthropic → (anthropic as any).embedding('...') — fallback, will warn at runtime
 */
export function embeddingCallExpr(provider: ProviderEntry, model: string): string {
  return provider.embeddingMethod
    ? `${provider.importName}.${provider.embeddingMethod}('${model}')`
    : `(${provider.importName} as any).embedding('${model}')`
}

/**
 * Returns a typed speech model call expression, or falls back to `as any`.
 *
 * Example outputs:
 *   openai    → openai.speech('tts-1')
 *   others    → (provider as any).speech?.('tts-1') ?? provider('defaultModel') as any
 */
export function speechCallExpr(provider: ProviderEntry): string {
  return provider.speechMethod
    ? `${provider.importName}.${provider.speechMethod}('tts-1')`
    : `(${provider.importName} as any).speech?.('tts-1') ?? ${provider.importName}('${provider.defaultModel}') as any`
}

/**
 * Returns a typed transcription model call expression, or falls back to `as any`.
 *
 * Example outputs:
 *   openai    → openai.transcription('whisper-1')
 *   others    → (provider as any).transcription?.('whisper-1') ?? provider('defaultModel') as any
 */
export function transcriptionCallExpr(provider: ProviderEntry): string {
  return provider.transcriptionMethod
    ? `${provider.importName}.${provider.transcriptionMethod}('whisper-1')`
    : `(${provider.importName} as any).transcription?.('whisper-1') ?? ${provider.importName}('${provider.defaultModel}') as any`
}
