import type { ToolsConfig } from '../types.js'
import { read, render } from '../utils/template.js'

export function generateToolsStub(config: ToolsConfig): string {
  const varName = `${config.toolName}Tools`
  const t = read('tools-stub.ts')
  return render(t, {
    __TOOL_NAME__: config.toolName,
    __TOOLS_VAR_NAME__: varName,
  })
}
