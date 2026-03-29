import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

function getTemplatesDir(): string {
  const here = dirname(fileURLToPath(import.meta.url))
  // prod: dist/wingman.js → dirname = dist/ → dist/templates/
  const fromDist = resolve(here, 'templates')
  // dev: src/utils/template.ts → dirname = src/utils/ → src/templates/
  const fromSrc = resolve(here, '../templates')
  if (existsSync(fromDist)) return fromDist
  if (existsSync(fromSrc)) return fromSrc
  throw new Error(`Templates directory not found. Looked in:\n  ${fromDist}\n  ${fromSrc}`)
}

/** Read a template file */
export function read(name: string): string {
  return readFileSync(resolve(getTemplatesDir(), name), 'utf-8')
}

/** Replace all sentinel keys with their values */
export function render(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((t, [k, v]) => t.replaceAll(k, v), template)
}

/** Replace all `// __INJECT:MARKER__\n` occurrences with block (+ trailing newline), or remove them if block is empty */
export function inject(template: string, marker: string, block: string): string {
  const placeholder = `// __INJECT:${marker}__\n`
  return template.replaceAll(placeholder, block ? block + '\n' : '')
}
