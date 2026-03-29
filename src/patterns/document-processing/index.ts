import { promptDocumentProcessingConfig } from './prompt-config.js'
import { executeDocumentProcessingPattern } from './execute.js'
import type { DocumentProcessingConfig, Pattern, PlanEntry, SharedConfig } from '../../types.js'

function getPackages(config: DocumentProcessingConfig): string[] {
  const pkgs = [config.provider.package, 'ai', 'zod']
  if (config.auth) pkgs.push('next-auth@5.0.0-beta.30')
  return pkgs
}

function getPlanEntries(config: DocumentProcessingConfig): PlanEntry[] {
  const entries: PlanEntry[] = [
    { kind: 'create', path: config.paths.apiRoute, ...(config.pathOverwrites.apiRoute && { overwrite: true }) },
    { kind: 'create', path: config.paths.schema, ...(config.pathOverwrites.schema && { overwrite: true }) },
  ]
  if (config.paths.hook) {
    entries.push({ kind: 'create', path: config.paths.hook, ...(config.pathOverwrites.hook && { overwrite: true }) })
  }
  return entries
}

export const documentProcessingPattern: Pattern = {
  id: 'document-processing',
  description: 'PDF / file upload pipeline — extract typed JSON using generateText + Output.object',
  cliFlags: ['schemaName', 'schemaPath', 'hookPath', 'hook', 'apiRoute'],

  async promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown> {
    return promptDocumentProcessingConfig(shared, (opts ?? {}) as Record<string, unknown>)
  },

  getPackages(config: unknown): string[] {
    return getPackages(config as DocumentProcessingConfig)
  },

  getPlanEntries(config: unknown): PlanEntry[] {
    return getPlanEntries(config as DocumentProcessingConfig)
  },

  getEnvVars(config: unknown): string[] {
    return [(config as DocumentProcessingConfig).provider.envVar]
  },

  async execute(config: unknown, shared: SharedConfig): Promise<void> {
    return executeDocumentProcessingPattern(config as DocumentProcessingConfig, shared)
  },
}
