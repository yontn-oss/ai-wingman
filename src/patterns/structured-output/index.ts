import { promptStructuredOutputConfig } from './prompt-config.js'
import { executeStructuredOutputPattern } from './execute.js'
import type { AddChatOptions, Pattern, PlanEntry, SharedConfig, StructuredOutputConfig } from '../../types.js'

function getPackages(config: StructuredOutputConfig): string[] {
  const pkgs = [config.provider.package, 'zod']
  if (config.auth) pkgs.push('next-auth@5.0.0-beta.30')
  return pkgs
}

function getPlanEntries(config: StructuredOutputConfig): PlanEntry[] {
  const entries: PlanEntry[] = []

  entries.push({ kind: 'create', path: config.paths.apiRoute, ...(config.pathOverwrites.apiRoute && { overwrite: true }) })
  entries.push({ kind: 'create', path: config.paths.schema, ...(config.pathOverwrites.schema && { overwrite: true }) })

  if (config.paths.hook) {
    entries.push({ kind: 'create', path: config.paths.hook, ...(config.pathOverwrites.hook && { overwrite: true }) })
  }

  return entries
}

export const structuredOutputPattern: Pattern = {
  id: 'structured-output',
  description: 'Structured JSON output from natural language input using generateText + Output.object',
  cliFlags: ['schemaName', 'schemaPath', 'hookPath', 'hook', 'apiRoute'],

  async promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown> {
    return promptStructuredOutputConfig(shared, (opts ?? {}) as AddChatOptions)
  },

  getPackages(config: unknown): string[] {
    return getPackages(config as StructuredOutputConfig)
  },

  getPlanEntries(config: unknown): PlanEntry[] {
    return getPlanEntries(config as StructuredOutputConfig)
  },

  getEnvVars(config: unknown): string[] {
    return [(config as StructuredOutputConfig).provider.envVar]
  },

  async execute(config: unknown, shared: SharedConfig): Promise<void> {
    return executeStructuredOutputPattern(config as StructuredOutputConfig, shared)
  },
}
