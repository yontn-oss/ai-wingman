import type { ProviderEntry } from '../types.js'

export const providers: ProviderEntry[] = [
  {
    id: 'anthropic',
    label: 'Anthropic',
    package: '@ai-sdk/anthropic',
    importName: 'anthropic',
    envVar: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-opus-4-5',
    modelFactory: 'anthropic("claude-opus-4-5")',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    package: '@ai-sdk/openai',
    importName: 'openai',
    envVar: 'OPENAI_API_KEY',
    defaultModel: 'gpt-5.4-nano',
    modelFactory: 'openai("gpt-5.4-nano")',
    embeddingMethod: 'embedding',
    speechMethod: 'speech',
    transcriptionMethod: 'transcription',
  },
  {
    id: 'google',
    label: 'Google',
    package: '@ai-sdk/google',
    importName: 'google',
    envVar: 'GOOGLE_GENERATIVE_AI_API_KEY',
    defaultModel: 'gemini-2.0-flash',
    modelFactory: 'google("gemini-2.0-flash")',
    embeddingMethod: 'textEmbeddingModel',
  },
]
