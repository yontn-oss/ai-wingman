// no config dependency — static seed data
import { read } from '../utils/template.js'

export function generateEvalDatasetJsonl(): string {
  return read('eval-dataset-jsonl.ts')
}
