import type { InterruptPatternConfig, WingmanConfig } from '../types.js'
import { read } from '../utils/template.js'

export function generateApprovalWidget(_config: InterruptPatternConfig | WingmanConfig): string {
  return read('interrupt-approval-widget.tsx')
}
