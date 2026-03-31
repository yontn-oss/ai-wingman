import { generateBackgroundAgentEnqueueRoute } from '../../generators/background-agent-enqueue-route.js'
import { generateBackgroundAgentStatusRoute } from '../../generators/background-agent-status-route.js'
import { generateBackgroundAgentWorker } from '../../generators/background-agent-worker.js'
import { generateBackgroundAgentJobStore } from '../../generators/background-agent-job-store.js'
import { ensureAtAlias } from '../../steps/ensure-at-alias.js'
import { detectPathAlias } from '../../utils/detect-path-alias.js'
import { createWriter } from '../../utils/write-file.js'
import type { BackgroundAgentConfig, SharedConfig } from '../../types.js'

export async function executeBackgroundAgentPattern(
  config: BackgroundAgentConfig,
  _shared: SharedConfig
): Promise<void> {
  ensureAtAlias(config.targetDir)
  const { prefix: pathAlias } = detectPathAlias(config.targetDir)
  const freshConfig: BackgroundAgentConfig = { ...config, pathAlias }

  const write = createWriter(config.targetDir)

  write(freshConfig.paths.jobStore)(generateBackgroundAgentJobStore())
  write(freshConfig.paths.worker)(generateBackgroundAgentWorker(freshConfig))
  write(freshConfig.paths.enqueueRoute)(generateBackgroundAgentEnqueueRoute(freshConfig))
  write(freshConfig.paths.statusRoute)(generateBackgroundAgentStatusRoute(freshConfig))
}
