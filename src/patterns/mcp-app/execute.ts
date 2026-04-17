import * as clack from '@clack/prompts'
import { generateMcpAppRoute } from '../../generators/mcp-app-route.js'
import { generateMcpAppUiBundle } from '../../generators/mcp-app-ui.js'
import { generateMcpAppState } from '../../generators/mcp-app-state.js'
import { createWriter } from '../../utils/write-file.js'
import type { McpAppConfig, SharedConfig } from '../../types.js'

export async function executeMcpAppPattern(config: McpAppConfig, _shared: SharedConfig): Promise<void> {
  const write = createWriter(config.targetDir)

  write(config.paths.apiRoute)(generateMcpAppRoute(config))
  write(config.paths.uiBundle)(generateMcpAppUiBundle(config))

  if (config.includeState && config.paths.state) {
    write(config.paths.state)(generateMcpAppState(config))
  }

  clack.log.info(`Register your MCP server with Claude.ai or ChatGPT:\n  http://localhost:3000/${config.paths.apiRoute.replace(/\/route\.tsx?$/, '')}`)
}
