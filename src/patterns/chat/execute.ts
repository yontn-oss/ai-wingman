import * as clack from '@clack/prompts'
import path from 'node:path'
import { runAiElements } from '../../steps/run-ai-elements.js'
import { runShadcn } from '../../steps/run-shadcn.js'
import { ensureAtAlias } from '../../steps/ensure-at-alias.js'
import { fixFontVars, fixDarkMode } from '../../steps/fix-font-vars.js'
import { generateApiRoute, generateConversationsRoute, generateConversationByIdRoute } from '../../generators/api-route.js'
import { generateStorage } from '../../generators/storage.js'
import { generatePageComponent } from '../../generators/page-component.js'
import { generateInterruptTools } from '../../generators/interrupt-tools.js'
import { generateApprovalWidget } from '../../generators/interrupt-approval-widget.js'
import { writeFile } from '../../utils/write-file.js'
import { deriveConversationsRoutePath, deriveConversationByIdRoutePath } from './index.js'
import type { SharedConfig, WingmanConfig } from '../../types.js'

export async function executeChatPattern(config: WingmanConfig, _shared: SharedConfig): Promise<void> {
  const write = (relPath: string) => (content: string) => {
    writeFile(path.join(config.targetDir, relPath), content)
    clack.log.success(`Created ${relPath}`)
  }

  if (config.components.includes('chat-ui')) {
    ensureAtAlias(config.targetDir)
    // ai-elements components hardcode @/ imports — update pathAlias so generated
    // page imports match where files actually land.
    config.pathAlias = '@/'
    await runAiElements(config.targetDir)
    fixFontVars(config.targetDir)
    fixDarkMode(config.targetDir)
    await runShadcn(config.targetDir, ['button', 'input'])
  }

  if (config.components.includes('api-route')) {
    write(config.paths.apiRoute)(generateApiRoute(config))
  }

  if (config.components.includes('storage') && config.paths.storage) {
    write(config.paths.storage)(generateStorage(config))

    // Conversation management routes (always written alongside storage)
    write(deriveConversationsRoutePath(config.paths.apiRoute))(generateConversationsRoute(config))
    write(deriveConversationByIdRoutePath(config.paths.apiRoute))(generateConversationByIdRoute(config))
  }

  if (config.components.includes('page-component') && config.paths.pageComponent) {
    write(config.paths.pageComponent)(generatePageComponent(config))
  }

  if (config.includeInterrupt && config.paths.interruptToolsFile) {
    write(config.paths.interruptToolsFile)(generateInterruptTools(config))
  }

  if (config.includeInterrupt && config.paths.approvalWidgetFile) {
    write(config.paths.approvalWidgetFile)(generateApprovalWidget(config))
  }
}
