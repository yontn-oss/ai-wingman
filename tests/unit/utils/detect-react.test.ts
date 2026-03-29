import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { detectReact } from '../../../src/utils/detect-react.js'

let dir: string

beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wingman-test-')) })
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

function writePkg(deps: Record<string, string>) {
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ dependencies: deps }))
}

describe('detectReact', () => {
  it('returns true when both react and react-dom are present', () => {
    writePkg({ react: '^19.0.0', 'react-dom': '^19.0.0' })
    expect(detectReact(dir)).toBe(true)
  })

  it('returns false when react-dom is missing', () => {
    writePkg({ react: '^19.0.0' })
    expect(detectReact(dir)).toBe(false)
  })

  it('returns false when react is missing', () => {
    writePkg({ 'react-dom': '^19.0.0' })
    expect(detectReact(dir)).toBe(false)
  })

  it('returns false when package.json is absent', () => {
    expect(detectReact(dir)).toBe(false)
  })

  it('finds react in devDependencies', () => {
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ devDependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' } })
    )
    expect(detectReact(dir)).toBe(true)
  })
})
