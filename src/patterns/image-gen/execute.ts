import * as clack from '@clack/prompts'
import path from 'node:path'
import { generateImageGenRoute } from '../../generators/image-gen-route.js'
import { generateImageGenPage } from '../../generators/image-gen-page.js'
import { ensureAtAlias } from '../../steps/ensure-at-alias.js'
import { runAiElements } from '../../steps/run-ai-elements.js'
import { runShadcn } from '../../steps/run-shadcn.js'
import { fixFontVars, fixDarkMode } from '../../steps/fix-font-vars.js'
import { detectPathAlias } from '../../utils/detect-path-alias.js'
import { writeFile } from '../../utils/write-file.js'
import type { ImageGenConfig, SharedConfig } from '../../types.js'

export async function executeImageGenPattern(
  config: ImageGenConfig,
  _shared: SharedConfig
): Promise<void> {
  const { prefix: pathAlias } = detectPathAlias(config.targetDir)
  const freshConfig: ImageGenConfig = { ...config, pathAlias }

  const write = (relPath: string) => (content: string) => {
    writeFile(path.join(config.targetDir, relPath), content)
    clack.log.success(`Created ${relPath}`)
  }

  write(freshConfig.paths.apiRoute)(generateImageGenRoute(freshConfig))

  if (freshConfig.includePage && freshConfig.paths.page) {
    ensureAtAlias(config.targetDir)
    freshConfig.pathAlias = '@/'
    await runAiElements(config.targetDir)
    fixFontVars(config.targetDir)
    fixDarkMode(config.targetDir)
    await runShadcn(config.targetDir, ['button', 'textarea'])
    write(freshConfig.paths.page)(generateImageGenPage(freshConfig))
  }
}
