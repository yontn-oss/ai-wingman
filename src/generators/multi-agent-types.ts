import { read } from '../utils/template.js'

// no config dependency — pure type file

export function generateMultiAgentTypes(): string {
  return read('multi-agent-types.ts')
}
