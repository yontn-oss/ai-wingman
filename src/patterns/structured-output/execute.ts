import * as clack from '@clack/prompts'
import path from 'node:path'
import { generateStructuredOutputRoute } from '../../generators/structured-output-route.js'
import { generateStructuredOutputSchema } from '../../generators/structured-output-schema.js'
import { generateStructuredOutputHook } from '../../generators/structured-output-hook.js'
import { ensureAtAlias } from '../../steps/ensure-at-alias.js'
import { detectPathAlias } from '../../utils/detect-path-alias.js'
import { writeFile } from '../../utils/write-file.js'
import type { SharedConfig, StructuredOutputConfig } from '../../types.js'

export async function executeStructuredOutputPattern(
  config: StructuredOutputConfig,
  _shared: SharedConfig
): Promise<void> {
  // Ensure a path alias exists in tsconfig (adds @/* if none configured).
  // Then re-detect so we use whatever alias is actually in the project —
  // including any @/* added by a prior pattern (e.g. chat) in the same run.
  ensureAtAlias(config.targetDir)
  const { prefix: pathAlias } = detectPathAlias(config.targetDir)
  const freshConfig: StructuredOutputConfig = { ...config, pathAlias }

  const write = (relPath: string) => (content: string) => {
    writeFile(path.join(config.targetDir, relPath), content)
    clack.log.success(`Created ${relPath}`)
  }

  write(freshConfig.paths.apiRoute)(generateStructuredOutputRoute(freshConfig))
  write(freshConfig.paths.schema)(generateStructuredOutputSchema(freshConfig.schemaName))

  if (freshConfig.paths.hook) {
    write(freshConfig.paths.hook)(generateStructuredOutputHook(freshConfig))
  }

}
