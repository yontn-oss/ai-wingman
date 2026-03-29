import * as clack from '@clack/prompts'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

export interface PathResult {
  value: string
  overwrite: boolean
  skip: boolean
}

export async function promptPath(
  message: string,
  defaultValue: string,
  targetDir: string,
  opts: { prefill?: string; overwrite?: boolean; yes?: boolean }
): Promise<PathResult> {
  const resolvedDefault = opts.prefill ?? defaultValue
  const nonInteractive = !!opts.prefill || !!opts.yes

  if (nonInteractive) {
    const abs = path.join(targetDir, resolvedDefault)
    if (fs.existsSync(abs)) {
      if (opts.overwrite) {
        return { value: resolvedDefault, overwrite: true, skip: false }
      }
      clack.log.warn(`${resolvedDefault} already exists — skipping. Use --overwrite to force.`)
      return { value: resolvedDefault, overwrite: false, skip: true }
    }
    return { value: resolvedDefault, overwrite: false, skip: false }
  }

  if (fs.existsSync(path.join(targetDir, defaultValue))) {
    clack.log.warn(`Default path ${defaultValue} already exists`)
  }

  let current = defaultValue

  while (true) {
    const input = await clack.text({
      message,
      initialValue: current,
      validate(value) {
        if (!value?.trim()) return 'Path is required'
        return undefined
      },
    })

    if (clack.isCancel(input)) {
      clack.cancel('Cancelled.')
      process.exit(0)
    }

    const inputStr = String(input ?? '').trim()
    const abs = path.join(targetDir, inputStr)

    if (fs.existsSync(abs)) {
      const action = await clack.select({
        message: `${inputStr} already exists — what do you want to do?`,
        options: [
          { value: 'overwrite', label: 'Overwrite existing file' },
          { value: 'change', label: 'Enter a different path' },
          { value: 'skip', label: 'Skip this component' },
        ],
      })

      if (clack.isCancel(action)) {
        clack.cancel('Cancelled.')
        process.exit(0)
      }

      if (action === 'overwrite') return { value: inputStr, overwrite: true, skip: false }
      if (action === 'skip') return { value: inputStr, overwrite: false, skip: true }

      current = inputStr
      continue
    }

    return { value: inputStr, overwrite: false, skip: false }
  }
}
