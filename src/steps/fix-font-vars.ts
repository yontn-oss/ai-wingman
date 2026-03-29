import * as clack from '@clack/prompts'
import fs from 'node:fs'
import path from 'node:path'

const LAYOUT_CANDIDATES = [
  'src/app/layout.tsx',
  'src/app/layout.ts',
  'app/layout.tsx',
  'app/layout.ts',
]

const GLOBALS_CANDIDATES = [
  'src/app/globals.css',
  'app/globals.css',
]

function readFirst(targetDir: string, candidates: string[]): { file: string; content: string } | null {
  for (const rel of candidates) {
    const abs = path.join(targetDir, rel)
    if (fs.existsSync(abs)) {
      return { file: abs, content: fs.readFileSync(abs, 'utf8') }
    }
  }
  return null
}

/**
 * After shadcn init (via ai-elements), globals.css may contain:
 *   --font-sans: var(--font-sans)   ← circular self-reference
 *
 * This happens because shadcn's template uses a placeholder that expects the
 * project to have already mapped --font-sans to a real font. create-next-app
 * projects use --font-geist-sans (or similar) set on <html> via next/font.
 *
 * This step detects the circular reference and patches it to reference the
 * font variable actually configured in layout.tsx.
 */
export function fixFontVars(targetDir: string): void {
  const globals = readFirst(targetDir, GLOBALS_CANDIDATES)
  if (!globals) return
  if (!globals.content.includes('--font-sans: var(--font-sans)')) return

  const layout = readFirst(targetDir, LAYOUT_CANDIDATES)
  if (!layout) return

  // Find font variable names declared in layout: variable: "--font-geist-sans"
  const matches = [...layout.content.matchAll(/variable:\s*["'](-{2}font-[^"']+)["']/g)]
  const sansFontVar = matches.map((m) => m[1]).filter((v): v is string => v !== undefined).find((v) => !v.includes('mono'))

  if (!sansFontVar) return

  const fixed = globals.content.replace(
    '--font-sans: var(--font-sans)',
    `--font-sans: var(${sansFontVar})`
  )
  fs.writeFileSync(globals.file, fixed, 'utf8')
  clack.log.success(`Fixed font: --font-sans now references var(${sansFontVar})`)
}

/**
 * shadcn init replaces the create-next-app globals.css with one that uses the
 * `.dark` CSS class for dark mode (via `@custom-variant dark (&:is(.dark *))`).
 * A fresh CNA project has no ThemeProvider and never adds `.dark` to <html>,
 * so dark mode stops working entirely — including Tailwind `dark:` utilities
 * used by ai-elements components.
 *
 * This step converts the class-only dark mode back to system-preference dark
 * mode by removing the class-only `@custom-variant` (letting Tailwind v4 use
 * its built-in media-query behavior) and wrapping the `.dark { }` variable
 * block in `@media (prefers-color-scheme: dark) { :root { } }`.
 */
export function fixDarkMode(targetDir: string): void {
  const globals = readFirst(targetDir, GLOBALS_CANDIDATES)
  if (!globals) return

  const css = globals.content

  // Only proceed if shadcn wrote class-only dark mode
  if (!css.includes('@custom-variant dark (&:is(.dark *))')) return
  // Don't touch if system preference is already handled
  if (css.includes('@media (prefers-color-scheme: dark)')) return

  // Extract the .dark { ... } block — shadcn only puts --prop: value; lines here
  const darkBlockMatch = css.match(/\.dark\s*\{([^{}]+)\}/)
  if (!darkBlockMatch) return

  const darkVars = darkBlockMatch[1]
  const mediaBlock = `@media (prefers-color-scheme: dark) {\n  :root {${darkVars}  }\n}`

  const fixed = css
    // Remove the class-only variant so Tailwind v4 falls back to media-query dark:
    .replace(/@custom-variant dark \(&:is\(\.dark \*\)\);\n?/, '')
    // Replace .dark { } with a media query block
    .replace(darkBlockMatch[0], mediaBlock)

  fs.writeFileSync(globals.file, fixed, 'utf8')
  clack.log.success('Fixed dark mode: system preference now activates dark theme automatically')
}
