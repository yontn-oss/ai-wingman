import type { EvalDatasetConfig } from '../types.js'
import { read, render } from '../utils/template.js'

export function generateEvalDatasetWorkflow(config: EvalDatasetConfig): string {
  let t = read('eval-dataset-workflow.yml')
  t = render(t, {
    __RUNNER_PATH__: config.paths.runner!,
    __ENV_VAR__: config.provider.envVar,
  })
  return t
}
