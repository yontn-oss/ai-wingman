import { defineConfig } from 'tsup'
import { cp } from 'fs/promises'

export default defineConfig([
  {
    entry: { wingman: 'bin/wingman.ts' },
    format: ['esm'],
    outDir: 'dist',
    banner: { js: '#!/usr/bin/env node' },
    clean: true,
    dts: false,
    async onSuccess() {
      await cp('src/templates', 'dist/templates', { recursive: true })
    },
  },
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    outDir: 'dist',
    clean: false,
    dts: true,
  },
])
