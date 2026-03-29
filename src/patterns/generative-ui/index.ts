import { promptGenerativeUiConfig } from './prompt-config.js'
import { executeGenerativeUiPattern } from './execute.js'
import type { GenerativeUiConfig, Pattern, PlanEntry, SharedConfig } from '../../types.js'

function getPackages(config: GenerativeUiConfig): string[] {
  const pkgs = [config.provider.package, 'ai', '@ai-sdk/react', 'zod']
  if (config.auth) pkgs.push('next-auth@5.0.0-beta.30')
  return pkgs
}

function getPlanEntries(config: GenerativeUiConfig): PlanEntry[] {
  return [
    { kind: 'create', path: config.paths.apiRoute, ...(config.pathOverwrites.apiRoute && { overwrite: true }) },
    { kind: 'create', path: config.paths.page, ...(config.pathOverwrites.page && { overwrite: true }) },
  ]
}

export const generativeUiPattern: Pattern = {
  id: 'generative-ui',
  description: 'Stream text and render tool calls as React components using streamText + useChat',
  cliFlags: ['routePath', 'pagePath'],

  async promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown> {
    return promptGenerativeUiConfig(shared, (opts ?? {}) as Record<string, unknown>)
  },

  getPackages(config: unknown): string[] {
    return getPackages(config as GenerativeUiConfig)
  },

  getPlanEntries(config: unknown): PlanEntry[] {
    return getPlanEntries(config as GenerativeUiConfig)
  },

  getEnvVars(config: unknown): string[] {
    return [(config as GenerativeUiConfig).provider.envVar]
  },

  async execute(config: unknown, shared: SharedConfig): Promise<void> {
    return executeGenerativeUiPattern(config as GenerativeUiConfig, shared)
  },
}
