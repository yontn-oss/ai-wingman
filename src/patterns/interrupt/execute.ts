import * as clack from '@clack/prompts'
import path from 'node:path'
import { generateInterruptRoute } from '../../generators/interrupt-route.js'
import { generateInterruptTools } from '../../generators/interrupt-tools.js'
import { generateApprovalWidget } from '../../generators/interrupt-approval-widget.js'
import { generateInterruptPage } from '../../generators/interrupt-page.js'
import { ensureAtAlias } from '../../steps/ensure-at-alias.js'
import { detectPathAlias } from '../../utils/detect-path-alias.js'
import { writeFile } from '../../utils/write-file.js'
import type { InterruptPatternConfig, SharedConfig } from '../../types.js'

export async function executeInterruptPattern(
  config: InterruptPatternConfig,
  _shared: SharedConfig
): Promise<void> {
  ensureAtAlias(config.targetDir)
  const { prefix: pathAlias } = detectPathAlias(config.targetDir)
  const freshConfig: InterruptPatternConfig = { ...config, pathAlias }

  const write = (relPath: string) => (content: string) => {
    writeFile(path.join(config.targetDir, relPath), content)
    clack.log.success(`Created ${relPath}`)
  }

  write(freshConfig.paths.apiRoute)(generateInterruptRoute(freshConfig))
  write(freshConfig.paths.tools)(generateInterruptTools(freshConfig))
  write(freshConfig.paths.component)(generateApprovalWidget(freshConfig))

  if (freshConfig.includePage && freshConfig.paths.page) {
    write(freshConfig.paths.page)(generateInterruptPage(freshConfig))
  }

  clack.note(
    '⚠  The interrupt pattern is pending further discovery.\n' +
    'Behaviour under multi-tool sequences and concurrent approval requests\n' +
    'is not yet fully characterised. Review carefully before production use.',
    'Important'
  )
}
