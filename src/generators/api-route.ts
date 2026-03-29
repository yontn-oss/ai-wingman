import type { WingmanConfig } from '../types.js'
import { read, render, inject } from '../utils/template.js'
import { toImportPath } from '../utils/to-import-path.js'
import { authStub, storageStub } from './stubs.js'
import { MAX_DURATION_STANDARD } from '../defaults.js'

export function generateApiRoute(config: WingmanConfig): string {
  const hasStorage = config.components.includes('storage')
  const hasAuth = config.components.includes('auth')
  const hasInterrupt = config.includeInterrupt === true
  const storageImportPath = toImportPath(
    config.paths.storage ?? 'lib/storage.ts',
    config.pathAlias
  )
  const interruptToolsImportPath = toImportPath(
    config.paths.interruptToolsFile ?? 'lib/interrupt-tools.ts',
    config.pathAlias
  )

  let templateName: string
  if (hasStorage) {
    templateName = 'api-route-storage.ts'
  } else if (hasInterrupt) {
    templateName = 'api-route-interrupt.ts'
  } else {
    templateName = 'api-route.ts'
  }

  let t = read(templateName)
  const vars: Record<string, string> = {
    __MAX_DURATION__: MAX_DURATION_STANDARD,
    __PROVIDER_IMPORT__: config.provider.importName,
    __PROVIDER_PACKAGE__: config.provider.package,
    __MODEL_FACTORY__: config.provider.modelFactory,
  }
  if (hasStorage) {
    vars.__STORAGE_IMPORT_PATH__ = storageImportPath
  }
  if (hasInterrupt) {
    vars.__INTERRUPT_TOOLS_IMPORT_PATH__ = interruptToolsImportPath
  }
  t = render(t, vars)
  t = inject(t, 'AUTH_IMPORT', hasAuth ? `import { auth } from '${config.pathAlias}auth'` : '')
  t = inject(t, 'AUTH_CHECK', hasAuth
    ? `  const session = await auth()\n  if (!session) return new Response('Unauthorized', { status: 401 })`
    : authStub(config.pathAlias)
  )
  if (!hasStorage) {
    t = inject(t, 'STORAGE_STUB', storageStub(config.pathAlias))
  }
  return t
}

/** POST /api/chat/conversations  — create conversation (server-issued ID)
 *  GET  /api/chat/conversations  — list all conversations */
export function generateConversationsRoute(config: WingmanConfig): string {
  const storageImportPath = toImportPath(
    config.paths.storage ?? 'lib/storage.ts',
    config.pathAlias
  )
  const hasAuth = config.components.includes('auth')

  let t = read('conversations-route.ts')
  t = render(t, {
    __STORAGE_IMPORT_PATH__: storageImportPath,
  })
  t = inject(t, 'AUTH_IMPORT', hasAuth ? `import { auth } from '${config.pathAlias}auth'` : '')
  // conversations-route has AUTH_CHECK in both POST and GET with no blank line after marker
  // When auth=true: pass block with trailing \n so inject adds a blank line separator
  // When auth=false: pass '' to remove the placeholder entirely
  t = inject(t, 'AUTH_CHECK', hasAuth
    ? `  const session = await auth()\n  if (!session) return new Response('Unauthorized', { status: 401 })\n`
    : ''
  )
  return t
}

/** GET /api/chat/conversations/[id]  — fetch history for a single conversation */
export function generateConversationByIdRoute(config: WingmanConfig): string {
  const storageImportPath = toImportPath(
    config.paths.storage ?? 'lib/storage.ts',
    config.pathAlias
  )
  const hasAuth = config.components.includes('auth')

  let t = read('conversation-by-id-route.ts')
  t = render(t, {
    __STORAGE_IMPORT_PATH__: storageImportPath,
  })
  t = inject(t, 'AUTH_IMPORT', hasAuth ? `import { auth } from '${config.pathAlias}auth'` : '')
  // Same pattern as conversations-route
  t = inject(t, 'AUTH_CHECK', hasAuth
    ? `  const session = await auth()\n  if (!session) return new Response('Unauthorized', { status: 401 })\n`
    : ''
  )
  return t
}
