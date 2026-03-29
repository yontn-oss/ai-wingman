import * as clack from '@clack/prompts'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const SKILL_URL = 'https://ai-wingman.dev/SKILL.md'
const DEFAULT_OUTPUT = 'SKILL.md'

export async function skillCommand(opts: { output?: string }): Promise<void> {
  const outPath = path.resolve(process.cwd(), opts.output ?? DEFAULT_OUTPUT)

  clack.intro('ai-wingman skill')

  const spinner = clack.spinner()
  spinner.start(`Downloading ${SKILL_URL}`)

  await new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(outPath)
    https.get(SKILL_URL, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
    }).on('error', reject)
  }).catch((err: Error) => {
    spinner.stop('Download failed')
    clack.log.error(err.message)
    process.exit(1)
  })

  spinner.stop(`Saved to ${path.relative(process.cwd(), outPath)}`)
  clack.note(
    'Add this file to your AI coding assistant\'s context or skills directory.',
    'Next step'
  )
  clack.outro('Done!')
}
