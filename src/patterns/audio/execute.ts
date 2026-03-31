import { generateAudioTranscribeRoute } from '../../generators/audio-transcribe-route.js'
import { generateAudioSpeechRoute } from '../../generators/audio-speech-route.js'
import { generateAudioPage } from '../../generators/audio-page.js'
import { ensureAtAlias } from '../../steps/ensure-at-alias.js'
import { runAiElements } from '../../steps/run-ai-elements.js'
import { runShadcn } from '../../steps/run-shadcn.js'
import { fixFontVars, fixDarkMode } from '../../steps/fix-font-vars.js'
import { detectPathAlias } from '../../utils/detect-path-alias.js'
import { createWriter } from '../../utils/write-file.js'
import type { AudioConfig, SharedConfig } from '../../types.js'

export async function executeAudioPattern(
  config: AudioConfig,
  _shared: SharedConfig
): Promise<void> {
  const { prefix: pathAlias } = detectPathAlias(config.targetDir)
  const freshConfig: AudioConfig = { ...config, pathAlias }

  const write = createWriter(config.targetDir)

  if (freshConfig.includeTranscribe && freshConfig.paths.transcribeRoute) {
    write(freshConfig.paths.transcribeRoute)(generateAudioTranscribeRoute(freshConfig))
  }

  if (freshConfig.includeSpeech && freshConfig.paths.speechRoute) {
    write(freshConfig.paths.speechRoute)(generateAudioSpeechRoute(freshConfig))
  }

  if (freshConfig.includePage && freshConfig.paths.page) {
    ensureAtAlias(config.targetDir)
    freshConfig.pathAlias = '@/'
    await runAiElements(config.targetDir)
    fixFontVars(config.targetDir)
    fixDarkMode(config.targetDir)
    await runShadcn(config.targetDir, ['button', 'input'])
    write(freshConfig.paths.page)(generateAudioPage(freshConfig))
  }
}
