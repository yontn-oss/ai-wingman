import { promptImageGenConfig } from './prompt-config.js'
import { executeImageGenPattern } from './execute.js'
import type { ImageGenConfig, Pattern, PlanEntry, SharedConfig } from '../../types.js'

function getPackages(config: ImageGenConfig): string[] {
  const pkgs = ['@ai-sdk/openai', 'ai']
  if (config.auth) pkgs.push('next-auth@5.0.0-beta.30')
  return pkgs
}

function getPlanEntries(config: ImageGenConfig): PlanEntry[] {
  const entries: PlanEntry[] = [
    { kind: 'create', path: config.paths.apiRoute, ...(config.pathOverwrites.apiRoute && { overwrite: true }) },
  ]
  if (config.includePage && config.paths.page) {
    entries.push({ kind: 'create', path: config.paths.page, ...(config.pathOverwrites.page && { overwrite: true }) })
  }
  return entries
}

export const imageGenPattern: Pattern = {
  id: 'image-gen',
  description: 'Prompt-to-image generation using generateImage + OpenAI DALL·E',
  cliFlags: ['imageModel', 'page', 'apiRoute', 'pagePath'],

  async promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown> {
    return promptImageGenConfig(shared, (opts ?? {}) as Record<string, unknown>)
  },

  getPackages(config: unknown): string[] {
    return getPackages(config as ImageGenConfig)
  },

  getPlanEntries(config: unknown): PlanEntry[] {
    return getPlanEntries(config as ImageGenConfig)
  },

  getEnvVars(_config: unknown): string[] {
    return ['OPENAI_API_KEY']
  },

  async execute(config: unknown, shared: SharedConfig): Promise<void> {
    return executeImageGenPattern(config as ImageGenConfig, shared)
  },
}
