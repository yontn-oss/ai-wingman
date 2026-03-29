// no config dependency — pure infrastructure file
import { read } from '../utils/template.js'

export function generateBackgroundAgentJobStore(): string {
  return read('background-agent-job-store.ts')
}
