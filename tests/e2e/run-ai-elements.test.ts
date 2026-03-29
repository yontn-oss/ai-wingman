/**
 * E2E — runs the real shadcn CLI against a fixture.
 *
 * Purpose: catch upstream breakage (registry URL changes, renamed components,
 * shadcn API changes) that unit tests on pure arg-builders cannot detect.
 *
 * Test-specific flags passed via extraArgs:
 *   --yes           suppress shadcn's "add these components?" confirmation
 *   --base radix    suppress the base-library prompt if shadcn init is triggered
 *   --preset nova   suppress the preset prompt if shadcn init is triggered
 *
 * These flags are appropriate here because E2E tests need a deterministic,
 * non-interactive environment. They are not part of production code.
 *
 * Run: pnpm test:e2e
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildAiElementsArgs, AI_ELEMENTS_COMPONENTS } from '../../src/steps/run-ai-elements.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../../../../')
const EXAMPLE_DIR = path.join(REPO_ROOT, 'examples/next-app')

let fixtureDir: string

beforeAll(() => {
  fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wingman-e2e-'))

  for (const f of ['package.json', 'tsconfig.json', 'components.json', 'postcss.config.mjs']) {
    fs.copyFileSync(path.join(EXAMPLE_DIR, f), path.join(fixtureDir, f))
  }

  fs.mkdirSync(path.join(fixtureDir, 'app'), { recursive: true })
  fs.copyFileSync(
    path.join(EXAMPLE_DIR, 'app/globals.css'),
    path.join(fixtureDir, 'app/globals.css')
  )

  // Symlink node_modules to avoid a full npm install in every run
  fs.symlinkSync(path.join(EXAMPLE_DIR, 'node_modules'), path.join(fixtureDir, 'node_modules'))
}, 10_000)

afterAll(() => {
  if (fixtureDir) fs.rmSync(fixtureDir, { recursive: true, force: true })
})

describe('ai-elements via real shadcn CLI', () => {
  it(
    'installs all components into the fixture without prompting',
    () => {
      const [cmd, args] = buildAiElementsArgs(['--yes', '--base', 'radix', '--preset', 'nova'])
      const result = spawnSync(cmd, args, { cwd: fixtureDir, stdio: 'pipe', shell: true })

      expect(result.status, result.stderr?.toString()).toBe(0)

      for (const component of AI_ELEMENTS_COMPONENTS) {
        const dest = path.join(fixtureDir, 'components/ai-elements', `${component}.tsx`)
        expect(fs.existsSync(dest), `missing: components/ai-elements/${component}.tsx`).toBe(true)
      }
    },
    120_000
  )
})
