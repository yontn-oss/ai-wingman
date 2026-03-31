import { generateAgentRoute } from '../../generators/agent-route.js'
import { generateAgentPage } from '../../generators/agent-page.js'
import { generateStorage } from '../../generators/storage.js'
import { generateToolsStub } from '../../generators/tools-stub.js'
import { ensureAtAlias } from '../../steps/ensure-at-alias.js'
import { runAiElements } from '../../steps/run-ai-elements.js'
import { runShadcn } from '../../steps/run-shadcn.js'
import { fixFontVars, fixDarkMode } from '../../steps/fix-font-vars.js'
import { detectPathAlias } from '../../utils/detect-path-alias.js'
import { createWriter } from '../../utils/write-file.js'
import type { AgentConfig, SharedConfig, ToolsConfig } from '../../types.js'

export async function executeAgentPattern(
  config: AgentConfig,
  _shared: SharedConfig
): Promise<void> {
  const { prefix: pathAlias } = detectPathAlias(config.targetDir)
  const freshConfig: AgentConfig = { ...config, pathAlias }

  const write = createWriter(config.targetDir)

  write(freshConfig.paths.apiRoute)(generateAgentRoute(freshConfig))
  write(freshConfig.paths.storage)(generateStorage())

  // Reuse the tools stub generator — just adapt to ToolsConfig shape
  const toolsStubConfig: ToolsConfig = {
    toolName: config.agentName,
    auth: false,
    paths: { apiRoute: config.paths.apiRoute, toolsFile: config.paths.toolsFile },
    pathOverwrites: {},
    provider: config.provider,
    pathAlias: freshConfig.pathAlias,
    targetDir: config.targetDir,
  }
  write(freshConfig.paths.toolsFile)(generateToolsStub(toolsStubConfig))

  if (freshConfig.includePage && freshConfig.paths.page) {
    ensureAtAlias(config.targetDir)
    freshConfig.pathAlias = '@/'
    await runAiElements(config.targetDir)
    fixFontVars(config.targetDir)
    fixDarkMode(config.targetDir)
    await runShadcn(config.targetDir, ['button', 'input'])
    write(freshConfig.paths.page)(generateAgentPage(freshConfig))
  }
}
