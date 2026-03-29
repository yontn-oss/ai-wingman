import { promptEvalConfig } from './prompt-config.js'
import { executeEvalPattern } from './execute.js'
import type { EvalConfig, Pattern, PlanEntry, SharedConfig } from '../../types.js'

export const evalPattern: Pattern = {
  id: 'eval',
  description: 'LLM eval loop — run prompts, score outputs with a judge model, catch regressions (optional: JSONL dataset, GitHub Actions CI)',
  cliFlags: [],

  async promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown> {
    return promptEvalConfig(shared, (opts ?? {}) as Record<string, unknown>)
  },

  getPackages(config: unknown): string[] {
    const c = config as EvalConfig
    return [c.provider.package, 'ai', 'tsx']
  },

  getPlanEntries(config: unknown): PlanEntry[] {
    const c = config as EvalConfig
    const entries: PlanEntry[] = []

    if (c.useDataset) {
      if (c.paths.dataset)  entries.push({ kind: 'create', path: c.paths.dataset,  ...(c.pathOverwrites.dataset  && { overwrite: true }) })
      if (c.paths.runner)   entries.push({ kind: 'create', path: c.paths.runner,   ...(c.pathOverwrites.runner   && { overwrite: true }) })
    } else {
      if (c.paths.evalScript) entries.push({ kind: 'create', path: c.paths.evalScript, ...(c.pathOverwrites.evalScript && { overwrite: true }) })
    }

    if (c.includeWorkflow && c.paths.workflow) {
      entries.push({ kind: 'create', path: c.paths.workflow, ...(c.pathOverwrites.workflow && { overwrite: true }) })
    }

    return entries
  },

  getEnvVars(config: unknown): string[] {
    return [(config as EvalConfig).provider.envVar]
  },

  async execute(config: unknown, shared: SharedConfig): Promise<void> {
    return executeEvalPattern(config as EvalConfig, shared)
  },
}
