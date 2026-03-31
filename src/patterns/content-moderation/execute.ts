import { generateContentModerationRoute } from '../../generators/content-moderation-route.js'
import { generateContentModerationPolicy } from '../../generators/content-moderation-policy.js'
import { ensureAtAlias } from '../../steps/ensure-at-alias.js'
import { detectPathAlias } from '../../utils/detect-path-alias.js'
import { createWriter } from '../../utils/write-file.js'
import type { ContentModerationConfig, SharedConfig } from '../../types.js'

export async function executeContentModerationPattern(
  config: ContentModerationConfig,
  _shared: SharedConfig
): Promise<void> {
  ensureAtAlias(config.targetDir)
  const { prefix: pathAlias } = detectPathAlias(config.targetDir)
  const freshConfig: ContentModerationConfig = { ...config, pathAlias }

  const write = createWriter(config.targetDir)

  write(freshConfig.paths.apiRoute)(generateContentModerationRoute(freshConfig))
  write(freshConfig.paths.policy)(generateContentModerationPolicy())
}
