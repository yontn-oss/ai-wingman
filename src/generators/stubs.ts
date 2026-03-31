import { inject } from '../utils/template.js'

export function injectAuth(t: string, hasAuth: boolean, pathAlias: string): string {
  t = inject(t, 'AUTH_IMPORT', hasAuth ? `import { auth } from '${pathAlias}auth'` : '')
  t = inject(t, 'AUTH_CHECK', hasAuth
    ? `  const session = await auth()\n  if (!session) return new Response('Unauthorized', { status: 401 })`
    : authStub(pathAlias)
  )
  return t
}

export function storageStub(pathAlias: string): string {
  return [
    '  // TODO: bring your own storage',
    '  // Add conversation persistence here. Example:',
    `  //   import { storage } from '${pathAlias}lib/storage'`,
    '  //   await storage.saveMessages(conversationId, messages)',
  ].join('\n')
}

export function authStub(pathAlias: string): string {
  return [
    '  // TODO: bring your own auth',
    '  // Add session validation here before processing messages. Example with NextAuth:',
    `  //   import { auth } from '${pathAlias}auth'`,
    '  //   const session = await auth()',
    "  //   if (!session) return new Response('Unauthorized', { status: 401 })",
  ].join('\n')
}
