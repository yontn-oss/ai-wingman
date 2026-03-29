import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { ensureAtAlias } from '../../../src/steps/ensure-at-alias.js'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wingman-alias-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function writeTsconfig(content: string) {
  fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), content, 'utf8')
}

function readTsconfig(): { compilerOptions?: { paths?: Record<string, string[]>; baseUrl?: string } } {
  return JSON.parse(fs.readFileSync(path.join(tmpDir, 'tsconfig.json'), 'utf8'))
}

describe('ensureAtAlias', () => {
  it('adds @/* when paths is empty', () => {
    writeTsconfig(JSON.stringify({ compilerOptions: { paths: {} } }))
    ensureAtAlias(tmpDir)
    expect(readTsconfig().compilerOptions?.paths?.['@/*']).toEqual(['./*'])
  })

  it('adds @/* when compilerOptions has no paths key', () => {
    writeTsconfig(JSON.stringify({ compilerOptions: { strict: true } }))
    ensureAtAlias(tmpDir)
    expect(readTsconfig().compilerOptions?.paths?.['@/*']).toEqual(['./*'])
  })

  it('adds baseUrl when missing', () => {
    writeTsconfig(JSON.stringify({ compilerOptions: {} }))
    ensureAtAlias(tmpDir)
    expect(readTsconfig().compilerOptions?.baseUrl).toBe('.')
  })

  it('preserves existing baseUrl', () => {
    writeTsconfig(JSON.stringify({ compilerOptions: { baseUrl: './src', paths: {} } }))
    ensureAtAlias(tmpDir)
    expect(readTsconfig().compilerOptions?.baseUrl).toBe('./src')
  })

  it('does nothing when @/* already exists', () => {
    const original = JSON.stringify({ compilerOptions: { paths: { '@/*': ['./*'] } } })
    writeTsconfig(original)
    ensureAtAlias(tmpDir)
    // File content should be unchanged (still has @/*)
    expect(readTsconfig().compilerOptions?.paths?.['@/*']).toEqual(['./*'])
  })

  it('preserves other aliases when adding @/*', () => {
    writeTsconfig(JSON.stringify({ compilerOptions: { paths: { '~/*': ['./*'] } } }))
    ensureAtAlias(tmpDir)
    const paths = readTsconfig().compilerOptions?.paths
    expect(paths?.['~/*']).toEqual(['./*'])
    expect(paths?.['@/*']).toEqual(['./*'])
  })

  it('handles tsconfig with trailing commas', () => {
    writeTsconfig(`{
      "compilerOptions": {
        "paths": {
          "~/*": ["./*"],
        },
      },
    }`)
    ensureAtAlias(tmpDir)
    expect(readTsconfig().compilerOptions?.paths?.['@/*']).toEqual(['./*'])
  })

  it('handles tsconfig with line comments', () => {
    writeTsconfig(`{
      // root tsconfig
      "compilerOptions": {
        "paths": {
          "~/*": ["./*"]
        }
      }
    }`)
    ensureAtAlias(tmpDir)
    expect(readTsconfig().compilerOptions?.paths?.['@/*']).toEqual(['./*'])
  })

  it('does nothing when tsconfig.json does not exist', () => {
    expect(() => ensureAtAlias(tmpDir)).not.toThrow()
  })
})
