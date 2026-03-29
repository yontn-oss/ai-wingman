import * as clack from '@clack/prompts'
import path from 'node:path'
import { generateToolsRoute } from '../../generators/tools-route.js'
import { generateToolsStub } from '../../generators/tools-stub.js'
import { ensureAtAlias } from '../../steps/ensure-at-alias.js'
import { detectPathAlias } from '../../utils/detect-path-alias.js'
import { writeFile } from '../../utils/write-file.js'
import type { SharedConfig, ToolsConfig } from '../../types.js'

export async function executeToolsPattern(
  config: ToolsConfig,
  _shared: SharedConfig
): Promise<void> {
  ensureAtAlias(config.targetDir)
  const { prefix: pathAlias } = detectPathAlias(config.targetDir)
  const freshConfig: ToolsConfig = { ...config, pathAlias }

  const write = (relPath: string) => (content: string) => {
    writeFile(path.join(config.targetDir, relPath), content)
    clack.log.success(`Created ${relPath}`)
  }

  write(freshConfig.paths.apiRoute)(generateToolsRoute(freshConfig))
  write(freshConfig.paths.toolsFile)(generateToolsStub(freshConfig))

}
