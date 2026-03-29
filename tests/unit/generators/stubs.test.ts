import { describe, it, expect } from 'vitest'
import { storageStub, authStub } from '../../../src/generators/stubs.js'

describe('storageStub', () => {
  it('contains the TODO marker', () => {
    expect(storageStub('@/')).toContain('TODO: bring your own storage')
  })

  it('includes the path alias in the example import', () => {
    expect(storageStub('@/')).toContain("@/lib/storage")
    expect(storageStub('~/')).toContain("~/lib/storage")
  })

  it('returns a multi-line comment block', () => {
    const output = storageStub('@/')
    expect(output.split('\n').length).toBeGreaterThan(1)
    expect(output).toContain('//')
  })

  it('snapshot — @/ alias', () => {
    expect(storageStub('@/')).toMatchSnapshot()
  })

  it('snapshot — ~/ alias', () => {
    expect(storageStub('~/')).toMatchSnapshot()
  })
})

describe('authStub', () => {
  it('contains the TODO marker', () => {
    expect(authStub('@/')).toContain('TODO: bring your own auth')
  })

  it('includes the path alias in the example import', () => {
    expect(authStub('@/')).toContain("@/auth")
    expect(authStub('~/')).toContain("~/auth")
  })

  it('mentions Unauthorized in the example', () => {
    expect(authStub('@/')).toContain('Unauthorized')
  })

  it('returns a multi-line comment block', () => {
    const output = authStub('@/')
    expect(output.split('\n').length).toBeGreaterThan(1)
    expect(output).toContain('//')
  })

  it('snapshot — @/ alias', () => {
    expect(authStub('@/')).toMatchSnapshot()
  })

  it('snapshot — ~/ alias', () => {
    expect(authStub('~/')).toMatchSnapshot()
  })
})
