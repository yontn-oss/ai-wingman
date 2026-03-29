import * as clack from '@clack/prompts'
import path from 'node:path'
import { generateMultimodalRoute } from '../../generators/multimodal-route.js'
import { generateMultimodalPage } from '../../generators/multimodal-page.js'
import { ensureAtAlias } from '../../steps/ensure-at-alias.js'
import { runAiElements } from '../../steps/run-ai-elements.js'
import { runShadcn } from '../../steps/run-shadcn.js'
import { fixFontVars, fixDarkMode } from '../../steps/fix-font-vars.js'
import { detectPathAlias } from '../../utils/detect-path-alias.js'
import { writeFile } from '../../utils/write-file.js'
import type { MultimodalConfig, SharedConfig } from '../../types.js'

export async function executeMultimodalPattern(
  config: MultimodalConfig,
  _shared: SharedConfig
): Promise<void> {
  const { prefix: pathAlias } = detectPathAlias(config.targetDir)
  const freshConfig: MultimodalConfig = { ...config, pathAlias }

  const write = (relPath: string) => (content: string) => {
    writeFile(path.join(config.targetDir, relPath), content)
    clack.log.success(`Created ${relPath}`)
  }

  write(freshConfig.paths.apiRoute)(generateMultimodalRoute(freshConfig))

  if (freshConfig.includePage && freshConfig.paths.page) {
    ensureAtAlias(config.targetDir)
    freshConfig.pathAlias = '@/'
    await runAiElements(config.targetDir)
    fixFontVars(config.targetDir)
    fixDarkMode(config.targetDir)
    await runShadcn(config.targetDir, ['button', 'input'])
    write(freshConfig.paths.page)(generateMultimodalPage(freshConfig))
  }
}
