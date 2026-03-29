import { read } from '../utils/template.js'

export function generateContentModerationPolicy(): string {
  return read('content-moderation-policy.ts')
}
