import type { AudioConfig } from '../types.js'
import { read, render } from '../utils/template.js'

function deriveApiPath(outputPath: string): string {
  return '/' + outputPath
    .replace(/^src\//, '')
    .replace(/^app\//, '')
    .replace(/\/route\.tsx?$/, '')
}

export function generateAudioPage(config: AudioConfig): string {
  const transcribePath = config.paths.transcribeRoute
    ? deriveApiPath(config.paths.transcribeRoute)
    : '/api/audio/transcribe'
  const speechPath = config.paths.speechRoute
    ? deriveApiPath(config.paths.speechRoute)
    : '/api/audio/speech'

  let templateName: string
  if (config.includeTranscribe && config.includeSpeech) {
    templateName = 'audio-page-both.tsx'
  } else if (config.includeTranscribe) {
    templateName = 'audio-page-transcribe-only.tsx'
  } else {
    templateName = 'audio-page-speech-only.tsx'
  }

  return render(read(templateName), {
    __PATH_ALIAS__: config.pathAlias,
    __TRANSCRIBE_PATH__: transcribePath,
    __SPEECH_PATH__: speechPath,
  })
}
