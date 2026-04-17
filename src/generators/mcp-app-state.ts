import type { McpAppConfig } from '../types.js'
import { read } from '../utils/template.js'

export function generateMcpAppState(_config: McpAppConfig): string {
  return read('mcp-app-state.ts')
}
