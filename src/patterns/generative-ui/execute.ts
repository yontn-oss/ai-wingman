import { generateGenerativeUiRoute } from '../../generators/generative-ui-route.js'
import { generateGenerativeUiPage } from '../../generators/generative-ui-page.js'
import { ensureAtAlias } from '../../steps/ensure-at-alias.js'
import { runAiElements } from '../../steps/run-ai-elements.js'
import { runShadcn } from '../../steps/run-shadcn.js'
import { fixFontVars, fixDarkMode } from '../../steps/fix-font-vars.js'
import { createWriter } from '../../utils/write-file.js'
import type { GenerativeUiConfig, SharedConfig } from '../../types.js'

export async function executeGenerativeUiPattern(
  config: GenerativeUiConfig,
  _shared: SharedConfig
): Promise<void> {
  ensureAtAlias(config.targetDir)
  const freshConfig: GenerativeUiConfig = { ...config, pathAlias: '@/' }

  const write = createWriter(config.targetDir)

  await runAiElements(config.targetDir)
  fixFontVars(config.targetDir)
  fixDarkMode(config.targetDir)
  await runShadcn(config.targetDir, ['button', 'textarea'])

  write(freshConfig.paths.apiRoute)(generateGenerativeUiRoute(freshConfig))
  write(freshConfig.paths.page)(generateGenerativeUiPage(freshConfig))

}
