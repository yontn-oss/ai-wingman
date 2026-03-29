import * as clack from '@clack/prompts'
import path from 'node:path'
import { generateGenerativeUiRoute } from '../../generators/generative-ui-route.js'
import { generateGenerativeUiPage } from '../../generators/generative-ui-page.js'
import { ensureAtAlias } from '../../steps/ensure-at-alias.js'
import { runAiElements } from '../../steps/run-ai-elements.js'
import { runShadcn } from '../../steps/run-shadcn.js'
import { fixFontVars, fixDarkMode } from '../../steps/fix-font-vars.js'
import { detectPathAlias } from '../../utils/detect-path-alias.js'
import { writeFile } from '../../utils/write-file.js'
import type { GenerativeUiConfig, SharedConfig } from '../../types.js'

export async function executeGenerativeUiPattern(
  config: GenerativeUiConfig,
  _shared: SharedConfig
): Promise<void> {
  ensureAtAlias(config.targetDir)
  const { prefix: pathAlias } = detectPathAlias(config.targetDir)
  const freshConfig: GenerativeUiConfig = { ...config, pathAlias: '@/' }

  const write = (relPath: string) => (content: string) => {
    writeFile(path.join(config.targetDir, relPath), content)
    clack.log.success(`Created ${relPath}`)
  }

  await runAiElements(config.targetDir)
  fixFontVars(config.targetDir)
  fixDarkMode(config.targetDir)
  await runShadcn(config.targetDir, ['button', 'textarea'])

  write(freshConfig.paths.apiRoute)(generateGenerativeUiRoute(freshConfig))
  write(freshConfig.paths.page)(generateGenerativeUiPage(freshConfig))

  void pathAlias // used via freshConfig
}
