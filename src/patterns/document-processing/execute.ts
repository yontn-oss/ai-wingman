import * as clack from '@clack/prompts'
import path from 'node:path'
import { generateDocumentProcessingRoute } from '../../generators/document-processing-route.js'
import { generateDocumentProcessingSchema } from '../../generators/document-processing-schema.js'
import { generateDocumentProcessingHook } from '../../generators/document-processing-hook.js'
import { ensureAtAlias } from '../../steps/ensure-at-alias.js'
import { detectPathAlias } from '../../utils/detect-path-alias.js'
import { writeFile } from '../../utils/write-file.js'
import type { DocumentProcessingConfig, SharedConfig } from '../../types.js'

export async function executeDocumentProcessingPattern(
  config: DocumentProcessingConfig,
  _shared: SharedConfig
): Promise<void> {
  ensureAtAlias(config.targetDir)
  const { prefix: pathAlias } = detectPathAlias(config.targetDir)
  const freshConfig: DocumentProcessingConfig = { ...config, pathAlias }

  const write = (relPath: string) => (content: string) => {
    writeFile(path.join(config.targetDir, relPath), content)
    clack.log.success(`Created ${relPath}`)
  }

  write(freshConfig.paths.apiRoute)(generateDocumentProcessingRoute(freshConfig))
  write(freshConfig.paths.schema)(generateDocumentProcessingSchema(freshConfig.schemaName))

  if (freshConfig.paths.hook) {
    write(freshConfig.paths.hook)(generateDocumentProcessingHook(freshConfig))
  }
}
