import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fixFontVars, fixDarkMode } from '../../../src/steps/fix-font-vars.js'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wingman-fix-font-'))
  fs.mkdirSync(path.join(tmpDir, 'src', 'app'), { recursive: true })
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function writeGlobals(content: string, useSrc = true) {
  const dir = useSrc ? path.join(tmpDir, 'src', 'app') : path.join(tmpDir, 'app')
  if (!useSrc) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'globals.css'), content, 'utf8')
}

function writeLayout(content: string, useSrc = true) {
  const dir = useSrc ? path.join(tmpDir, 'src', 'app') : path.join(tmpDir, 'app')
  if (!useSrc) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'layout.tsx'), content, 'utf8')
}

function readGlobals(useSrc = true): string {
  const dir = useSrc ? path.join(tmpDir, 'src', 'app') : path.join(tmpDir, 'app')
  return fs.readFileSync(path.join(dir, 'globals.css'), 'utf8')
}

const CIRCULAR_GLOBALS = `@import "tailwindcss";
@theme inline {
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
}`

const GEIST_LAYOUT = `import { Geist, Geist_Mono } from 'next/font/google'

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export default function RootLayout({ children }) {
  return <html className={\`\${geistSans.variable} \${geistMono.variable}\`}>{children}</html>
}`

describe('fixFontVars', () => {
  it('patches circular --font-sans reference to real font variable', () => {
    writeGlobals(CIRCULAR_GLOBALS)
    writeLayout(GEIST_LAYOUT)
    fixFontVars(tmpDir)
    const result = readGlobals()
    expect(result).toContain('--font-sans: var(--font-geist-sans)')
    expect(result).not.toContain('--font-sans: var(--font-sans)')
  })

  it('does nothing when globals.css has no circular reference', () => {
    const alreadyFixed = `@theme inline { --font-sans: var(--font-geist-sans); }`
    writeGlobals(alreadyFixed)
    writeLayout(GEIST_LAYOUT)
    fixFontVars(tmpDir)
    expect(readGlobals()).toBe(alreadyFixed)
  })

  it('does nothing when globals.css does not exist', () => {
    writeLayout(GEIST_LAYOUT)
    // Should not throw
    expect(() => fixFontVars(tmpDir)).not.toThrow()
  })

  it('does nothing when layout.tsx does not exist', () => {
    writeGlobals(CIRCULAR_GLOBALS)
    // Should not throw, and globals should remain unchanged
    expect(() => fixFontVars(tmpDir)).not.toThrow()
    expect(readGlobals()).toBe(CIRCULAR_GLOBALS)
  })

  it('does nothing when layout has no font variable declarations', () => {
    writeGlobals(CIRCULAR_GLOBALS)
    writeLayout(`export default function RootLayout({ children }) { return <html>{children}</html> }`)
    fixFontVars(tmpDir)
    expect(readGlobals()).toBe(CIRCULAR_GLOBALS)
  })

  it('skips mono font and picks the sans font variable', () => {
    const layoutWithBoth = `
const sans = Font({ variable: "--font-geist-sans", subsets: ["latin"] })
const mono = Font({ variable: "--font-geist-mono", subsets: ["latin"] })
`
    writeGlobals(CIRCULAR_GLOBALS)
    writeLayout(layoutWithBoth)
    fixFontVars(tmpDir)
    expect(readGlobals()).toContain('--font-sans: var(--font-geist-sans)')
    expect(readGlobals()).not.toContain('--font-sans: var(--font-geist-mono)')
  })

  it('works with app/ directory layout (no src/)', () => {
    writeGlobals(CIRCULAR_GLOBALS, false)
    writeLayout(GEIST_LAYOUT, false)
    fixFontVars(tmpDir)
    expect(readGlobals(false)).toContain('--font-sans: var(--font-geist-sans)')
  })
})

const SHADCN_GLOBALS_WITH_DARK_CLASS = `@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
}
`

describe('fixDarkMode', () => {
  it('converts .dark class approach to system-preference dark mode', () => {
    writeGlobals(SHADCN_GLOBALS_WITH_DARK_CLASS)
    fixDarkMode(tmpDir)
    const result = readGlobals()
    // @custom-variant dark should be removed (Tailwind v4 default = media query)
    expect(result).not.toContain('@custom-variant dark')
    // .dark { } block should be replaced with a media query
    expect(result).not.toContain('.dark {')
    expect(result).toContain('@media (prefers-color-scheme: dark)')
    expect(result).toContain('--background: oklch(0.145 0 0)')
    expect(result).toContain('--foreground: oklch(0.985 0 0)')
  })

  it('does nothing when globals.css already has @media (prefers-color-scheme: dark)', () => {
    const alreadyFixed = `@import "tailwindcss";\n@media (prefers-color-scheme: dark) { :root { --background: oklch(0.145 0 0); } }`
    writeGlobals(alreadyFixed)
    fixDarkMode(tmpDir)
    expect(readGlobals()).toBe(alreadyFixed)
  })

  it('does nothing when @custom-variant dark is not the shadcn class-only variant', () => {
    const customVariant = `@import "tailwindcss";\n@custom-variant dark (&:where(.dark, .dark *));\n.dark { --background: oklch(0.145 0 0); }`
    writeGlobals(customVariant)
    fixDarkMode(tmpDir)
    expect(readGlobals()).toBe(customVariant)
  })

  it('does nothing when globals.css does not exist', () => {
    expect(() => fixDarkMode(tmpDir)).not.toThrow()
  })

  it('does nothing when there is no .dark { } block to convert', () => {
    const noBlock = `@import "tailwindcss";\n@custom-variant dark (&:is(.dark *));\n`
    writeGlobals(noBlock)
    fixDarkMode(tmpDir)
    // No .dark block → no patch (nothing to extract)
    expect(readGlobals()).toBe(noBlock)
  })

  it('works with app/ directory layout (no src/)', () => {
    writeGlobals(SHADCN_GLOBALS_WITH_DARK_CLASS, false)
    fixDarkMode(tmpDir)
    expect(readGlobals(false)).toContain('@media (prefers-color-scheme: dark)')
    expect(readGlobals(false)).not.toContain('@custom-variant dark')
  })
})
