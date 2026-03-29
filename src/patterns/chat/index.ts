import { promptChatConfig } from './prompt-config.js'
import { executeChatPattern } from './execute.js'
import { AI_ELEMENTS_COMPONENTS } from '../../steps/run-ai-elements.js'
import type { AddChatOptions, Pattern, PlanEntry, SharedConfig, WingmanConfig } from '../../types.js'

/** Derive the conversations route path from the chat API route path.
 *  e.g. app/api/chat/route.ts → app/api/chat/conversations/route.ts */
export function deriveConversationsRoutePath(apiRoute: string): string {
  return apiRoute.replace(/\/route\.tsx?$/, '/conversations/route.ts')
}

/** Derive the conversation-by-id route path from the chat API route path.
 *  e.g. app/api/chat/route.ts → app/api/chat/conversations/[id]/route.ts */
export function deriveConversationByIdRoutePath(apiRoute: string): string {
  return apiRoute.replace(/\/route\.tsx?$/, '/conversations/[id]/route.ts')
}

function getChatPackages(config: WingmanConfig): string[] {
  const pkgs = [config.provider.package, '@ai-sdk/react']
  if (config.auth) pkgs.push('next-auth@5.0.0-beta.30')
  return pkgs
}

function getChatPlanEntries(config: WingmanConfig): PlanEntry[] {
  const entries: PlanEntry[] = []

  if (config.components.includes('chat-ui')) {
    entries.push({
      kind: 'run',
      command: 'npx',
      args: ['shadcn@latest', 'add', ...AI_ELEMENTS_COMPONENTS.map(c => `<ai-elements:${c}>`), '--overwrite'],
    })
    entries.push({ kind: 'run', command: 'npx', args: ['shadcn@latest', 'add', 'button', 'input'] })
  }

  entries.push({ kind: 'create', path: config.paths.apiRoute, ...(config.pathOverwrites.apiRoute && { overwrite: true }) })

  if (config.paths.storage) {
    entries.push({ kind: 'create', path: config.paths.storage, ...(config.pathOverwrites.storage && { overwrite: true }) })
  }

  // Conversation management routes (only when storage is enabled)
  if (config.components.includes('storage')) {
    entries.push({ kind: 'create', path: deriveConversationsRoutePath(config.paths.apiRoute) })
    entries.push({ kind: 'create', path: deriveConversationByIdRoutePath(config.paths.apiRoute) })
  }

  if (config.paths.pageComponent) {
    entries.push({ kind: 'create', path: config.paths.pageComponent, ...(config.pathOverwrites.pageComponent && { overwrite: true }) })
  }

  if (config.includeInterrupt && config.paths.interruptToolsFile) {
    entries.push({ kind: 'create', path: config.paths.interruptToolsFile })
  }

  if (config.includeInterrupt && config.paths.approvalWidgetFile) {
    entries.push({ kind: 'create', path: config.paths.approvalWidgetFile })
  }

  return entries
}

export const chatPattern: Pattern = {
  id: 'chat',
  description: 'Streaming chat with conversation history and optional storage',
  cliFlags: ['storage', 'page', 'chatUi', 'apiRoute', 'storagePath', 'pagePath', 'interrupt'],

  async promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown> {
    return promptChatConfig(shared, (opts ?? {}) as AddChatOptions)
  },

  getPackages(config: unknown): string[] {
    return getChatPackages(config as WingmanConfig)
  },

  getPlanEntries(config: unknown): PlanEntry[] {
    return getChatPlanEntries(config as WingmanConfig)
  },

  getEnvVars(config: unknown): string[] {
    const c = config as WingmanConfig
    const vars = [c.provider.envVar]
    if (c.components.includes('storage') && c.storage.envVar) vars.push(c.storage.envVar)
    return vars
  },

  async execute(config: unknown, shared: SharedConfig): Promise<void> {
    return executeChatPattern(config as WingmanConfig, shared)
  },
}
