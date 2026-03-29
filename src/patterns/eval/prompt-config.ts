import * as clack from '@clack/prompts'
import path from 'node:path'
import process from 'node:process'
import { promptPath } from '../../utils/prompt-path.js'
import type { EvalConfig, SharedConfig } from '../../types.js'

interface AddEvalOptions {
  evalPath?: string
  dataset?: boolean
  ci?: boolean
  overwrite?: boolean
  yes?: boolean
}

export async function promptEvalConfig(
  shared: SharedConfig,
  opts: AddEvalOptions = {}
): Promise<EvalConfig> {
  const { pathAlias, targetDir } = shared

  // ── Dataset toggle ──────────────────────────────────
  let useDataset = opts.dataset ?? false
  if (!useDataset && !opts.yes) {
    const answer = await clack.confirm({
      message: 'Use a dataset file (JSONL)?',
      initialValue: false,
    })
    if (clack.isCancel(answer)) { clack.cancel(); process.exit(0) }
    useDataset = answer
  }

  // ── Paths ───────────────────────────────────────────
  let evalScriptResult: { value: string; overwrite: boolean } | undefined
  let datasetResult: { value: string; overwrite: boolean } | undefined
  let runnerResult: { value: string; overwrite: boolean } | undefined

  if (useDataset) {
    datasetResult = await promptPath(
      'Dataset file output path',
      'evals/dataset.jsonl',
      targetDir,
      { ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
    )

    runnerResult = await promptPath(
      'Runner script output path',
      'evals/dataset-runner.ts',
      targetDir,
      { ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
    )
  } else {
    evalScriptResult = await promptPath(
      'Eval script output path',
      'evals/my-eval.ts',
      targetDir,
      { ...(opts.evalPath && { prefill: opts.evalPath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
    )
  }

  // ── CI workflow toggle ──────────────────────────────
  let includeWorkflow = opts.ci ?? false
  if (!includeWorkflow && !opts.yes) {
    const answer = await clack.confirm({
      message: 'Add GitHub Actions CI workflow?',
      initialValue: false,
    })
    if (clack.isCancel(answer)) { clack.cancel(); process.exit(0) }
    includeWorkflow = answer
  }

  let workflowResult: { value: string; overwrite: boolean } | undefined
  if (includeWorkflow) {
    workflowResult = await promptPath(
      'GitHub Actions workflow output path',
      '.github/workflows/eval.yml',
      targetDir,
      { ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
    )
  }

  // ── Info ─────────────────────────────────────────────
  if (!opts.yes) {
    const runPath = useDataset ? runnerResult!.value : evalScriptResult!.value
    clack.log.info(`Run evals: npx tsx ${runPath}`)
  }

  // ── Compute relative path from runner → dataset ─────
  const datasetRelativeFromRunner =
    (datasetResult && runnerResult)
      ? path.relative(path.dirname(runnerResult.value), datasetResult.value)
      : undefined

  return {
    useDataset,
    includeWorkflow,
    paths: {
      ...(evalScriptResult && { evalScript: evalScriptResult.value }),
      ...(datasetResult && { dataset: datasetResult.value }),
      ...(runnerResult && { runner: runnerResult.value }),
      ...(datasetRelativeFromRunner && { datasetRelativeFromRunner }),
      ...(workflowResult && { workflow: workflowResult.value }),
    },
    pathOverwrites: {
      ...(evalScriptResult?.overwrite && { evalScript: true }),
      ...(datasetResult?.overwrite && { dataset: true }),
      ...(runnerResult?.overwrite && { runner: true }),
      ...(workflowResult?.overwrite && { workflow: true }),
    },
    provider: shared.provider,
    pathAlias,
    targetDir,
  }
}
