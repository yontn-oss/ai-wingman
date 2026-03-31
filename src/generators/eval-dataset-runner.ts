import type { EvalDatasetConfig } from '../types.js'
import { read, render } from '../utils/template.js'

export function generateEvalDatasetRunner(config: EvalDatasetConfig): string {
  let t = read('eval-dataset-runner.ts')
  t = render(t, {
    __RUNNER_PATH__: config.paths.runner!,
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __MODEL_FACTORY__: config.provider.modelFactory,
    __DATASET_RELATIVE_FROM_RUNNER__: config.paths.datasetRelativeFromRunner!,
  })
  return t
}
