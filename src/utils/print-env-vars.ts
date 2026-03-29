import * as clack from '@clack/prompts'
import type { WingmanConfig } from '../types.js'

export function printEnvVars(config: WingmanConfig): void {
  const vars: string[] = [config.provider.envVar]

  if (config.components.includes('storage') && config.storage.envVar) {
    vars.push(config.storage.envVar)
  }

  clack.note(
    vars.map((v) => `${v}=`).join('\n'),
    'Add these to your .env.local'
  )
}
