import { describe, it, expect } from 'vitest'
import { generateImageGenRoute } from '../../../src/generators/image-gen-route.js'
import { generateImageGenPage } from '../../../src/generators/image-gen-page.js'
import type { ImageGenConfig } from '../../../src/types.js'

const baseConfig: ImageGenConfig = {
  imageModel: 'dall-e-3',
  auth: false,
  includePage: true,
  paths: {
    apiRoute: 'app/api/image-gen/route.ts',
    page: 'app/image-gen/page.tsx',
  },
  pathOverwrites: {},
  pathAlias: '@/',
  hasSrcDir: false,
  packageManager: 'pnpm',
  targetDir: '/tmp/test',
}

describe('generateImageGenRoute', () => {
  it('imports generateImage from ai and openai from @ai-sdk/openai', () => {
    const output = generateImageGenRoute(baseConfig)
    expect(output).toContain("import { generateImage } from 'ai'")
    expect(output).toContain("import { openai } from '@ai-sdk/openai'")
  })

  it('calls generateImage with the configured image model', () => {
    const output = generateImageGenRoute(baseConfig)
    expect(output).toContain("openai.image('dall-e-3')")
    expect(output).toContain('generateImage({')
  })

  it('returns the image as a data URL', () => {
    const output = generateImageGenRoute(baseConfig)
    expect(output).toContain('image.base64')
    expect(output).toContain('image.mediaType')
    expect(output).toContain('Response.json')
  })

  it('includes auth stub when auth is false', () => {
    const output = generateImageGenRoute(baseConfig)
    expect(output).toContain('TODO: bring your own auth')
  })

  it('includes auth guard when auth is true', () => {
    const output = generateImageGenRoute({ ...baseConfig, auth: true })
    expect(output).toContain("import { auth } from '@/auth'")
    expect(output).toContain('Unauthorized')
    expect(output).not.toContain('TODO: bring your own auth')
  })

  it('uses dall-e-2 when configured', () => {
    const output = generateImageGenRoute({ ...baseConfig, imageModel: 'dall-e-2' })
    expect(output).toContain("openai.image('dall-e-2')")
  })

  it('snapshot — no auth', () => {
    expect(generateImageGenRoute(baseConfig)).toMatchSnapshot()
  })
})

describe('generateImageGenPage', () => {
  it('uses the correct api path', () => {
    const output = generateImageGenPage(baseConfig)
    expect(output).toContain("const API_PATH = '/api/image-gen'")
  })

  it('imports shadcn Button and Textarea', () => {
    const output = generateImageGenPage(baseConfig)
    expect(output).toContain("from '@/components/ui/button'")
    expect(output).toContain("from '@/components/ui/textarea'")
  })

  it('has a download button', () => {
    const output = generateImageGenPage(baseConfig)
    expect(output).toContain('Download image')
    expect(output).toContain('download()')
  })

  it('renders the generated image', () => {
    const output = generateImageGenPage(baseConfig)
    expect(output).toContain('imageUrl')
    expect(output).toContain('<img')
  })

  it('handles loading and error states', () => {
    const output = generateImageGenPage(baseConfig)
    expect(output).toContain('loading')
    expect(output).toContain('error')
  })

  it('snapshot', () => {
    expect(generateImageGenPage(baseConfig)).toMatchSnapshot()
  })
})
