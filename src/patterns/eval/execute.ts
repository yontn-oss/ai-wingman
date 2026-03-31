import * as clack from '@clack/prompts'
import { generateEvalScript } from '../../generators/eval-script.js'
import { generateEvalDatasetJsonl } from '../../generators/eval-dataset-jsonl.js'
import { generateEvalDatasetRunner } from '../../generators/eval-dataset-runner.js'
import { generateEvalDatasetWorkflow } from '../../generators/eval-dataset-workflow.js'
import { createWriter } from '../../utils/write-file.js'
import type { EvalConfig, SharedConfig } from '../../types.js'

export async function executeEvalPattern(
  config: EvalConfig,
  _shared: SharedConfig
): Promise<void> {
  const write = createWriter(config.targetDir)

  if (config.useDataset) {
    write(config.paths.dataset!)(generateEvalDatasetJsonl())
    write(config.paths.runner!)(generateEvalDatasetRunner(config))
    clack.log.info(`Run evals: npx tsx ${config.paths.runner}`)
  } else {
    write(config.paths.evalScript!)(generateEvalScript(config))
    clack.log.info(`Run evals: npx tsx ${config.paths.evalScript}`)
  }

  if (config.includeWorkflow && config.paths.workflow) {
    write(config.paths.workflow)(generateEvalDatasetWorkflow(config))
  }
}
