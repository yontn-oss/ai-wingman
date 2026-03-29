import * as clack from '@clack/prompts'
import path from 'node:path'
import { generateHybridSearchRoute } from '../../generators/hybrid-search-route.js'
import { generateHybridSearchBm25 } from '../../generators/hybrid-search-bm25.js'
import { generateHybridSearchReranker } from '../../generators/hybrid-search-reranker.js'
import { generateHybridSearchStore } from '../../generators/hybrid-search-store.js'
import { ensureAtAlias } from '../../steps/ensure-at-alias.js'
import { detectPathAlias } from '../../utils/detect-path-alias.js'
import { writeFile } from '../../utils/write-file.js'
import type { HybridSearchConfig, SharedConfig } from '../../types.js'

export async function executeHybridSearchPattern(
  config: HybridSearchConfig,
  _shared: SharedConfig
): Promise<void> {
  ensureAtAlias(config.targetDir)
  const { prefix: pathAlias } = detectPathAlias(config.targetDir)
  const freshConfig: HybridSearchConfig = { ...config, pathAlias }

  const write = (relPath: string) => (content: string) => {
    writeFile(path.join(config.targetDir, relPath), content)
    clack.log.success(`Created ${relPath}`)
  }

  write(freshConfig.paths.apiRoute)(generateHybridSearchRoute(freshConfig))
  write(freshConfig.paths.bm25)(generateHybridSearchBm25())
  write(freshConfig.paths.reranker)(generateHybridSearchReranker())
  write(freshConfig.paths.hybridStore)(generateHybridSearchStore())
}
