import type { McpAppConfig } from '../types.js'
import { read, render } from '../utils/template.js'

export function generateMcpAppUiBundle(config: McpAppConfig): string {
  const t = read('mcp-app-ui.html')
  return render(t, {
    __APP_NAME__: config.appName,
    __TOOL_NAME__: `${config.appNameSnake}_tool`,
  })
}
