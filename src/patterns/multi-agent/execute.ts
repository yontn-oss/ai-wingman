import { generateMultiAgentOrchestratorRoute } from '../../generators/multi-agent-orchestrator-route.js'
import { generateMultiAgentSpecialists } from '../../generators/multi-agent-specialists.js'
import { generateMultiAgentHandoffTools } from '../../generators/multi-agent-handoff-tools.js'
import { generateMultiAgentTypes } from '../../generators/multi-agent-types.js'
import { ensureAtAlias } from '../../steps/ensure-at-alias.js'
import { detectPathAlias } from '../../utils/detect-path-alias.js'
import { createWriter } from '../../utils/write-file.js'
import type { MultiAgentConfig, SharedConfig } from '../../types.js'

export async function executeMultiAgentPattern(
  config: MultiAgentConfig,
  _shared: SharedConfig
): Promise<void> {
  ensureAtAlias(config.targetDir)
  const { prefix: pathAlias } = detectPathAlias(config.targetDir)
  const freshConfig: MultiAgentConfig = { ...config, pathAlias }

  const write = createWriter(config.targetDir)

  write(freshConfig.paths.types)(generateMultiAgentTypes())
  write(freshConfig.paths.specialists)(generateMultiAgentSpecialists(freshConfig))
  write(freshConfig.paths.handoffTools)(generateMultiAgentHandoffTools(freshConfig))
  write(freshConfig.paths.apiRoute)(generateMultiAgentOrchestratorRoute(freshConfig))
}
