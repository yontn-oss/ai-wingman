import { providers } from './providers.js'
import { storageAdapters } from './storage-adapters.js'
import type { StackRegistry } from '../types.js'

export function getRegistry(): StackRegistry {
  return {
    providers,
    storage: storageAdapters,
  }
}

export type { StackRegistry }
