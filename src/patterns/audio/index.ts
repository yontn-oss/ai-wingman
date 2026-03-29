import { promptAudioConfig } from './prompt-config.js'
import { executeAudioPattern } from './execute.js'
import type { AudioConfig, Pattern, PlanEntry, SharedConfig } from '../../types.js'

function getPackages(config: AudioConfig): string[] {
  const pkgs = [config.provider.package, 'ai']
  if (config.auth) pkgs.push('next-auth@5.0.0-beta.30')
  return pkgs
}

function getPlanEntries(config: AudioConfig): PlanEntry[] {
  const entries: PlanEntry[] = []
  if (config.includeTranscribe && config.paths.transcribeRoute) {
    entries.push({ kind: 'create', path: config.paths.transcribeRoute, ...(config.pathOverwrites.transcribeRoute && { overwrite: true }) })
  }
  if (config.includeSpeech && config.paths.speechRoute) {
    entries.push({ kind: 'create', path: config.paths.speechRoute, ...(config.pathOverwrites.speechRoute && { overwrite: true }) })
  }
  if (config.includePage && config.paths.page) {
    entries.push({ kind: 'create', path: config.paths.page, ...(config.pathOverwrites.page && { overwrite: true }) })
  }
  return entries
}

export const audioPattern: Pattern = {
  id: 'audio',
  description: 'Audio I/O — transcription (speech→text) and TTS (text→speech) routes',
  cliFlags: ['page', 'pagePath'],

  async promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown> {
    return promptAudioConfig(shared, (opts ?? {}) as Record<string, unknown>)
  },

  getPackages(config: unknown): string[] {
    return getPackages(config as AudioConfig)
  },

  getPlanEntries(config: unknown): PlanEntry[] {
    return getPlanEntries(config as AudioConfig)
  },

  getEnvVars(config: unknown): string[] {
    return [(config as AudioConfig).provider.envVar]
  },

  async execute(config: unknown, shared: SharedConfig): Promise<void> {
    return executeAudioPattern(config as AudioConfig, shared)
  },
}
