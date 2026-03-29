import { existsSync } from 'node:fs'
import path from 'node:path'

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

/**
 * Detects the package manager used in a project directory.
 * Falls back to the agent that invoked the CLI (npm_execpath / PNPM_HOME / etc.),
 * then defaults to npm.
 */
export function detectPackageManager(targetDir: string): PackageManager {
  // Lock-file heuristic (most reliable)
  if (existsSync(path.join(targetDir, 'bun.lockb'))) return 'bun'
  if (existsSync(path.join(targetDir, 'pnpm-lock.yaml'))) return 'pnpm'
  if (existsSync(path.join(targetDir, 'yarn.lock'))) return 'yarn'
  if (existsSync(path.join(targetDir, 'package-lock.json'))) return 'npm'

  // Caller agent heuristic (e.g. user ran `pnpm dlx ai-wingman`)
  const execPath = process.env['npm_execpath'] ?? ''
  if (execPath.includes('pnpm')) return 'pnpm'
  if (execPath.includes('yarn')) return 'yarn'
  if (execPath.includes('bun')) return 'bun'

  return 'npm'
}

/** Returns the install command args for a given package manager. */
export function installArgs(pm: PackageManager, pkg: string): string[] {
  switch (pm) {
    case 'yarn': return ['add', pkg]
    case 'bun': return ['add', pkg]
    default: return ['install', pkg]
  }
}
