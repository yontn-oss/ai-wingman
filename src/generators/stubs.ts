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
