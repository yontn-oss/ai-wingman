import { generateMemorySaveRoute } from '../../generators/memory-save-route.js'
import { generateMemoryRetrieveRoute } from '../../generators/memory-retrieve-route.js'
import { generateMemoryStore } from '../../generators/memory-store.js'
import { generateMemoryInject } from '../../generators/memory-inject.js'
import { ensureAtAlias } from '../../steps/ensure-at-alias.js'
import { detectPathAlias } from '../../utils/detect-path-alias.js'
import { createWriter } from '../../utils/write-file.js'
import type { MemoryConfig, SharedConfig } from '../../types.js'

export async function executeMemoryPattern(
  config: MemoryConfig,
  _shared: SharedConfig
): Promise<void> {
  ensureAtAlias(config.targetDir)
  const { prefix: pathAlias } = detectPathAlias(config.targetDir)
  const freshConfig: MemoryConfig = { ...config, pathAlias }

  const write = createWriter(config.targetDir)

  write(freshConfig.paths.saveRoute)(generateMemorySaveRoute(freshConfig))
  write(freshConfig.paths.retrieveRoute)(generateMemoryRetrieveRoute(freshConfig))
  write(freshConfig.paths.store)(generateMemoryStore())
  write(freshConfig.paths.inject)(generateMemoryInject(freshConfig))
}
