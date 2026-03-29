import * as clack from '@clack/prompts'
import path from 'node:path'
import { generateStreamObjectRoute } from '../../generators/stream-object-route.js'
import { generateStreamObjectHook } from '../../generators/stream-object-hook.js'
import { generateStructuredOutputSchema } from '../../generators/structured-output-schema.js'
import { ensureAtAlias } from '../../steps/ensure-at-alias.js'
import { detectPathAlias } from '../../utils/detect-path-alias.js'
import { writeFile } from '../../utils/write-file.js'
import type { SharedConfig, StreamObjectConfig } from '../../types.js'

export async function executeStreamObjectPattern(
  config: StreamObjectConfig,
  _shared: SharedConfig
): Promise<void> {
  ensureAtAlias(config.targetDir)
  const { prefix: pathAlias } = detectPathAlias(config.targetDir)
  const freshConfig: StreamObjectConfig = { ...config, pathAlias }

  const write = (relPath: string) => (content: string) => {
    writeFile(path.join(config.targetDir, relPath), content)
    clack.log.success(`Created ${relPath}`)
  }

  write(freshConfig.paths.apiRoute)(generateStreamObjectRoute(freshConfig))

  if (!freshConfig.schemaAlreadyExists) {
    write(freshConfig.paths.schema)(generateStructuredOutputSchema(freshConfig.schemaName))
  }

  if (freshConfig.paths.hook) {
    write(freshConfig.paths.hook)(generateStreamObjectHook(freshConfig))
  }

}
