import * as clack from '@clack/prompts'
import process from 'node:process'
import { promptPath } from '../../utils/prompt-path.js'
import type { AudioConfig, SharedConfig } from '../../types.js'

interface AddAudioOptions {
  transcribePath?: string
  speechPath?: string
  pagePath?: string
  page?: boolean
  auth?: boolean
  overwrite?: boolean
  yes?: boolean
}

export async function promptAudioConfig(
  shared: SharedConfig,
  opts: AddAudioOptions = {}
): Promise<AudioConfig> {
  const { pathAlias, hasSrcDir, targetDir, packageManager } = shared
  const src = hasSrcDir ? 'src/' : ''

  // Which components to include
  let includeTranscribe = true
  let includeSpeech = true

  if (!opts.yes) {
    const components = await clack.multiselect({
      message: 'Which audio components do you want to scaffold?',
      options: [
        { value: 'transcribe', label: 'Speech → Text  (transcription route)', hint: 'POST /api/audio/transcribe' },
        { value: 'speech',    label: 'Text → Speech  (TTS route)',           hint: 'POST /api/audio/speech' },
      ],
      initialValues: ['transcribe', 'speech'],
      required: true,
    })
    if (clack.isCancel(components)) { clack.cancel('Cancelled.'); process.exit(0) }
    includeTranscribe = (components as string[]).includes('transcribe')
    includeSpeech     = (components as string[]).includes('speech')
  }

  // Transcribe route path
  let transcribeResult: { value: string; overwrite?: boolean } | null = null
  if (includeTranscribe) {
    transcribeResult = await promptPath(
      'Transcription route output path',
      `${src}app/api/audio/transcribe/route.ts`,
      targetDir,
      { ...(opts.transcribePath && { prefill: opts.transcribePath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
    )
  }

  // Speech route path
  let speechResult: { value: string; overwrite?: boolean } | null = null
  if (includeSpeech) {
    speechResult = await promptPath(
      'TTS route output path',
      `${src}app/api/audio/speech/route.ts`,
      targetDir,
      { ...(opts.speechPath && { prefill: opts.speechPath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
    )
  }

  // Page component
  let includePage = true
  if (opts.page !== undefined) {
    includePage = opts.page
  } else if (!opts.yes) {
    const wantsPage = await clack.confirm({
      message: 'Generate a page component with recording UI?',
      initialValue: true,
    })
    if (clack.isCancel(wantsPage)) { clack.cancel('Cancelled.'); process.exit(0) }
    includePage = wantsPage === true
  }

  let pageResult: { value: string; overwrite?: boolean } | null = null
  if (includePage) {
    pageResult = await promptPath(
      'Page component output path',
      `${src}app/audio/page.tsx`,
      targetDir,
      { ...(opts.pagePath && { prefill: opts.pagePath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
    )
  }

  // Auth
  let auth = false
  if (opts.auth !== undefined) {
    auth = opts.auth
  } else if (!opts.yes) {
    const wantsAuth = await clack.confirm({
      message: 'Add NextAuth v5 authentication?',
      initialValue: false,
    })
    if (clack.isCancel(wantsAuth)) { clack.cancel('Cancelled.'); process.exit(0) }
    auth = wantsAuth === true
  }

  return {
    includeTranscribe,
    includeSpeech,
    includePage,
    auth,
    paths: {
      ...(transcribeResult && { transcribeRoute: transcribeResult.value }),
      ...(speechResult      && { speechRoute:    speechResult.value }),
      ...(pageResult        && { page:           pageResult.value }),
    },
    pathOverwrites: {
      ...(transcribeResult?.overwrite && { transcribeRoute: true }),
      ...(speechResult?.overwrite     && { speechRoute:    true }),
      ...(pageResult?.overwrite       && { page:           true }),
    },
    provider: shared.provider,
    pathAlias,
    hasSrcDir,
    packageManager,
    targetDir,
  }
}
