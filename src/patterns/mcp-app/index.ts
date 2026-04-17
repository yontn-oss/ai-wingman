import { promptMcpAppConfig } from './prompt-config.js'
import { executeMcpAppPattern } from './execute.js'
import type { AddChatOptions, McpAppConfig, Pattern, PlanEntry, SharedConfig } from '../../types.js'

function getMcpAppPackages(_config: McpAppConfig): string[] {
  return ['@modelcontextprotocol/sdk', 'zod']
}

function getMcpAppPlanEntries(config: McpAppConfig): PlanEntry[] {
  const entries: PlanEntry[] = [
    { kind: 'create', path: config.paths.apiRoute, ...(config.pathOverwrites.apiRoute && { overwrite: true }) },
    { kind: 'create', path: config.paths.uiBundle, ...(config.pathOverwrites.uiBundle && { overwrite: true }) },
  ]
  if (config.includeState && config.paths.state) {
    entries.push({ kind: 'create', path: config.paths.state, ...(config.pathOverwrites.state && { overwrite: true }) })
  }
  return entries
}

export const mcpAppPattern: Pattern = {
  id: 'mcp-app',
  description: 'MCP App server with interactive UI — renders in Claude.ai, ChatGPT, VS Code, and Goose',
  cliFlags: ['appName', 'apiRoute', 'uiBundle', 'state', 'statePath', 'auth'] as (keyof AddChatOptions)[],

  async promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown> {
    return promptMcpAppConfig(shared, (opts ?? {}) as AddChatOptions)
  },

  getPackages(config: unknown): string[] {
    return getMcpAppPackages(config as McpAppConfig)
  },

  getPlanEntries(config: unknown): PlanEntry[] {
    return getMcpAppPlanEntries(config as McpAppConfig)
  },

  getEnvVars(config: unknown): string[] {
    const c = config as McpAppConfig
    return c.auth ? ['NEXTAUTH_SECRET'] : []
  },

  async execute(config: unknown, shared: SharedConfig): Promise<void> {
    return executeMcpAppPattern(config as McpAppConfig, shared)
  },
}
