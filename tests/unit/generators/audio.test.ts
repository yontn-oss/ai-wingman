import { describe, it, expect } from 'vitest'
import { generateAudioTranscribeRoute } from '../../../src/generators/audio-transcribe-route.js'
import { generateAudioSpeechRoute } from '../../../src/generators/audio-speech-route.js'
import { generateAudioPage } from '../../../src/generators/audio-page.js'
import type { AudioConfig } from '../../../src/types.js'
import { providers } from '../../../src/registry/providers.js'

const baseConfig: AudioConfig = {
  includeTranscribe: true,
  includeSpeech: true,
  includePage: true,
  auth: false,
  paths: {
    transcribeRoute: 'app/api/audio/transcribe/route.ts',
    speechRoute: 'app/api/audio/speech/route.ts',
    page: 'app/audio/page.tsx',
  },
  pathOverwrites: {},
  provider: providers[0]!, // anthropic
  pathAlias: '@/',
  hasSrcDir: false,
  packageManager: 'pnpm',
  targetDir: '/tmp/test',
}

describe('generateAudioTranscribeRoute', () => {
  it('imports experimental_transcribe from ai', () => {
    const output = generateAudioTranscribeRoute(baseConfig)
    expect(output).toContain("import { experimental_transcribe as transcribe } from 'ai'")
  })

  it('decodes base64 audio via Buffer.from', () => {
    const output = generateAudioTranscribeRoute(baseConfig)
    expect(output).toContain("Buffer.from(audio, 'base64')")
  })

  it('passes audioBuffer directly to transcribe()', () => {
    const output = generateAudioTranscribeRoute(baseConfig)
    expect(output).toContain('audio: audioBuffer')
    expect(output).toContain('transcribe({')
  })

  it('returns { text } JSON response', () => {
    const output = generateAudioTranscribeRoute(baseConfig)
    expect(output).toContain('result.text')
    expect(output).toContain('Response.json({ text:')
  })

  it('includes auth stub when auth is false', () => {
    const output = generateAudioTranscribeRoute(baseConfig)
    expect(output).toContain('TODO: bring your own auth')
  })

  it('includes auth guard when auth is true', () => {
    const output = generateAudioTranscribeRoute({ ...baseConfig, auth: true })
    expect(output).toContain("import { auth } from '@/auth'")
    expect(output).toContain('Unauthorized')
    expect(output).not.toContain('TODO: bring your own auth')
  })

  it('exports maxDuration', () => {
    const output = generateAudioTranscribeRoute(baseConfig)
    expect(output).toContain('export const maxDuration = 30')
  })

  it('snapshot — no auth', () => {
    expect(generateAudioTranscribeRoute(baseConfig)).toMatchSnapshot()
  })
})

describe('generateAudioSpeechRoute', () => {
  it('imports experimental_generateSpeech from ai', () => {
    const output = generateAudioSpeechRoute(baseConfig)
    expect(output).toContain("import { experimental_generateSpeech as generateSpeech } from 'ai'")
  })

  it('calls generateSpeech with text and voice', () => {
    const output = generateAudioSpeechRoute(baseConfig)
    expect(output).toContain('generateSpeech({')
    expect(output).toContain('text,')
    expect(output).toContain("voice: 'alloy'")
  })

  it('returns audio/mpeg Response', () => {
    const output = generateAudioSpeechRoute(baseConfig)
    expect(output).toContain('audio/mpeg')
    expect(output).toContain('result.audio')
  })

  it('includes auth stub when auth is false', () => {
    const output = generateAudioSpeechRoute(baseConfig)
    expect(output).toContain('TODO: bring your own auth')
  })

  it('includes auth guard when auth is true', () => {
    const output = generateAudioSpeechRoute({ ...baseConfig, auth: true })
    expect(output).toContain("import { auth } from '@/auth'")
    expect(output).toContain('Unauthorized')
  })

  it('exports maxDuration', () => {
    const output = generateAudioSpeechRoute(baseConfig)
    expect(output).toContain('export const maxDuration = 30')
  })

  it('snapshot — no auth', () => {
    expect(generateAudioSpeechRoute(baseConfig)).toMatchSnapshot()
  })
})

describe('generateAudioPage', () => {
  it('uses the correct transcribe API path', () => {
    const output = generateAudioPage(baseConfig)
    expect(output).toContain("const TRANSCRIBE_PATH = '/api/audio/transcribe'")
  })

  it('uses the correct speech API path', () => {
    const output = generateAudioPage(baseConfig)
    expect(output).toContain("const SPEECH_PATH = '/api/audio/speech'")
  })

  it('uses MediaRecorder for recording', () => {
    const output = generateAudioPage(baseConfig)
    expect(output).toContain('MediaRecorder')
    expect(output).toContain('getUserMedia')
  })

  it('converts blob to base64 before sending', () => {
    const output = generateAudioPage(baseConfig)
    expect(output).toContain('blobToBase64')
    expect(output).toContain('FileReader')
    expect(output).toContain('readAsDataURL')
  })

  it('plays TTS audio via AudioContext', () => {
    const output = generateAudioPage(baseConfig)
    expect(output).toContain('AudioContext')
    expect(output).toContain('decodeAudioData')
  })

  it('omits transcription section when includeTranscribe is false', () => {
    const output = generateAudioPage({ ...baseConfig, includeTranscribe: false })
    expect(output).not.toContain('TRANSCRIBE_PATH')
    expect(output).not.toContain('MediaRecorder')
  })

  it('omits TTS section when includeSpeech is false', () => {
    const output = generateAudioPage({ ...baseConfig, includeSpeech: false })
    expect(output).not.toContain('SPEECH_PATH')
    expect(output).not.toContain('AudioContext')
  })

  it('imports Button and Input from shadcn/ui', () => {
    const output = generateAudioPage(baseConfig)
    expect(output).toContain("components/ui/button")
    expect(output).toContain("components/ui/input")
  })

  it('snapshot — both components', () => {
    expect(generateAudioPage(baseConfig)).toMatchSnapshot()
  })

  it('snapshot — transcribe only', () => {
    expect(generateAudioPage({ ...baseConfig, includeSpeech: false })).toMatchSnapshot()
  })

  it('snapshot — speech only', () => {
    expect(generateAudioPage({ ...baseConfig, includeTranscribe: false })).toMatchSnapshot()
  })
})
