import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { detectPathAlias } from '../../../src/utils/detect-path-alias.js'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wingman-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function writeTsconfig(content: string) {
  fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), content, 'utf8')
}

function mkSrcDir() {
  fs.mkdirSync(path.join(tmpDir, 'src', 'app'), { recursive: true })
}

describe('detectPathAlias', () => {
  it('returns ~/  as fallback when no tsconfig exists', () => {
    const result = detectPathAlias(tmpDir)
    expect(result.prefix).toBe('~/')
  })

  it('detects @/* mapped to ./* and returns @/', () => {
    writeTsconfig(JSON.stringify({
      compilerOptions: { paths: { '@/*': ['./*'] } }
    }))
    const result = detectPathAlias(tmpDir)
    expect(result.prefix).toBe('@/')
  })

  it('detects @/* mapped to ./src/* and returns @/', () => {
    writeTsconfig(JSON.stringify({
      compilerOptions: { paths: { '@/*': ['./src/*'] } }
    }))
    const result = detectPathAlias(tmpDir)
    expect(result.prefix).toBe('@/')
  })

  it('detects ~/* mapped to ./* and returns ~/', () => {
    writeTsconfig(JSON.stringify({
      compilerOptions: { paths: { '~/*': ['./*'] } }
    }))
    const result = detectPathAlias(tmpDir)
    expect(result.prefix).toBe('~/')
  })

  it('handles tsconfig with trailing commas (common in real projects)', () => {
    writeTsconfig(`{
      "compilerOptions": {
        "paths": {
          "@/*": ["./*"],
        },
      },
    }`)
    const result = detectPathAlias(tmpDir)
    expect(result.prefix).toBe('@/')
  })

  it('handles tsconfig with line comments', () => {
    writeTsconfig(`{
      // This is a comment
      "compilerOptions": {
        "paths": {
          "@/*": ["./*"] // inline comment
        }
      }
    }`)
    const result = detectPathAlias(tmpDir)
    expect(result.prefix).toBe('@/')
  })

  it('handles tsconfig with $schema URL (// inside a string value)', () => {
    writeTsconfig(`{
      "$schema": "https://json.schemastore.org/tsconfig",
      "compilerOptions": {
        "paths": {
          "@/*": ["./src/*"]
        }
      }
    }`)
    const result = detectPathAlias(tmpDir)
    expect(result.prefix).toBe('@/')
  })

  it('handles tsconfig with block comments', () => {
    writeTsconfig(`{
      /* block comment */
      "compilerOptions": {
        "paths": {
          "@/*": ["./*"]
        }
      }
    }`)
    const result = detectPathAlias(tmpDir)
    expect(result.prefix).toBe('@/')
  })

  it('detects src/ directory layout', () => {
    mkSrcDir()
    writeTsconfig(JSON.stringify({ compilerOptions: {} }))
    const result = detectPathAlias(tmpDir)
    expect(result.hasSrcDir).toBe(true)
  })

  it('reports hasSrcDir false when no src/app directory', () => {
    writeTsconfig(JSON.stringify({ compilerOptions: {} }))
    const result = detectPathAlias(tmpDir)
    expect(result.hasSrcDir).toBe(false)
  })

  it('ignores aliases that do not end with /*', () => {
    writeTsconfig(JSON.stringify({
      compilerOptions: { paths: { '@': ['.'] } }
    }))
    const result = detectPathAlias(tmpDir)
    expect(result.prefix).toBe('~/')
  })

  it('ignores aliases whose target is not a root pattern', () => {
    writeTsconfig(JSON.stringify({
      compilerOptions: { paths: { '@components/*': ['./src/components/*'] } }
    }))
    const result = detectPathAlias(tmpDir)
    expect(result.prefix).toBe('~/')
  })
})
