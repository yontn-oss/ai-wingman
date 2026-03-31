import { runAiElements } from '../../steps/run-ai-elements.js'
import { runShadcn } from '../../steps/run-shadcn.js'
import { ensureAtAlias } from '../../steps/ensure-at-alias.js'
import { fixFontVars, fixDarkMode } from '../../steps/fix-font-vars.js'
import { generateApiRoute, generateConversationsRoute, generateConversationByIdRoute } from '../../generators/api-route.js'
import { generateStorage } from '../../generators/storage.js'
import { generatePageComponent } from '../../generators/page-component.js'
import { generateInterruptTools } from '../../generators/interrupt-tools.js'
import { generateApprovalWidget } from '../../generators/interrupt-approval-widget.js'
import { createWriter } from '../../utils/write-file.js'
import { deriveConversationsRoutePath, deriveConversationByIdRoutePath } from './index.js'
import type { SharedConfig, WingmanConfig } from '../../types.js'

export async function executeChatPattern(config: WingmanConfig, _shared: SharedConfig): Promise<void> {
  const write = createWriter(config.targetDir)

  let freshConfig = config
  if (config.components.includes('chat-ui')) {
    ensureAtAlias(config.targetDir)
    // ai-elements components hardcode @/ imports — update pathAlias so generated
    // page imports match where files actually land.
    freshConfig = { ...config, pathAlias: '@/' }
    await runAiElements(config.targetDir)
    fixFontVars(config.targetDir)
    fixDarkMode(config.targetDir)
    await runShadcn(config.targetDir, ['button', 'input'])
  }

  if (freshConfig.components.includes('api-route')) {
    write(freshConfig.paths.apiRoute)(generateApiRoute(freshConfig))
  }

  if (freshConfig.components.includes('storage') && freshConfig.paths.storage) {
    write(freshConfig.paths.storage)(generateStorage(freshConfig))

    // Conversation management routes (always written alongside storage)
    write(deriveConversationsRoutePath(freshConfig.paths.apiRoute))(generateConversationsRoute(freshConfig))
    write(deriveConversationByIdRoutePath(freshConfig.paths.apiRoute))(generateConversationByIdRoute(freshConfig))
  }

  if (freshConfig.components.includes('page-component') && freshConfig.paths.pageComponent) {
    write(freshConfig.paths.pageComponent)(generatePageComponent(freshConfig))
  }

  if (freshConfig.includeInterrupt && freshConfig.paths.interruptToolsFile) {
    write(freshConfig.paths.interruptToolsFile)(generateInterruptTools(freshConfig))
  }

  if (freshConfig.includeInterrupt && freshConfig.paths.approvalWidgetFile) {
    write(freshConfig.paths.approvalWidgetFile)(generateApprovalWidget(freshConfig))
  }
}
