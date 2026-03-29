import { describe, it, expect } from 'vitest'
import { generateStorage } from '../../../src/generators/storage.js'
import type { WingmanConfig } from '../../../src/types.js'
import { providers } from '../../../src/registry/providers.js'
import { storageAdapters } from '../../../src/registry/storage-adapters.js'

const baseConfig: WingmanConfig = {
  components: ['api-route', 'storage'],
  provider: providers[0]!,
  storage: storageAdapters[0]!,
  auth: false,
  paths: { apiRoute: 'app/api/chat/route.ts', storage: 'lib/storage.ts' },
  pathOverwrites: {},
  targetDir: '/tmp/test',
  pathAlias: '~/',
  hasSrcDir: false,
}

describe('generateStorage', () => {
  it('generates in-memory storage with correct shape', () => {
    const output = generateStorage(baseConfig)
    expect(output).toContain('new Map<string, Messages>()')
    expect(output).toContain('createConversation')
    expect(output).toContain('listConversations')
    expect(output).toContain('getMessages')
    expect(output).toContain('saveMessages')
    expect(output).toContain('crypto.randomUUID()')
    expect(output).not.toContain('postgres')
    expect(output).not.toContain('require(')
    expect(output).toMatchSnapshot()
  })

  it('includes a TODO comment directing users to replace with their own DB', () => {
    const output = generateStorage(baseConfig)
    expect(output).toContain('TODO')
  })
})
