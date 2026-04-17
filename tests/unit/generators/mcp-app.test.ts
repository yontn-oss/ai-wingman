import { describe, it, expect } from 'vitest'
import { generateMcpAppRoute } from '../../../src/generators/mcp-app-route.js'
import { generateMcpAppUiBundle } from '../../../src/generators/mcp-app-ui.js'
import { generateMcpAppState } from '../../../src/generators/mcp-app-state.js'
import type { McpAppConfig } from '../../../src/types.js'

const baseConfig: McpAppConfig = {
  appName: 'my-app',
  appNameSnake: 'my_app',
  appNamePascal: 'MyApp',
  auth: false,
  includeState: false,
  paths: {
    apiRoute: 'app/api/mcp/route.ts',
    uiBundle: 'public/mcp-apps/my-app/index.html',
  },
  pathOverwrites: {},
  pathAlias: '@/',
  targetDir: '/tmp/test',
}

const withState: McpAppConfig = {
  ...baseConfig,
  includeState: true,
  paths: {
    ...baseConfig.paths,
    state: 'lib/mcp-my-app-state.ts',
  },
}

describe('generateMcpAppRoute', () => {
  it('exports runtime = nodejs', () => {
    expect(generateMcpAppRoute(baseConfig)).toContain("export const runtime = 'nodejs'")
  })

  it('imports McpServer and WebStandardStreamableHTTPServerTransport', () => {
    const output = generateMcpAppRoute(baseConfig)
    expect(output).toContain("from '@modelcontextprotocol/sdk/server/mcp.js'")
    expect(output).toContain("from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'")
  })

  it('uses randomUUID as sessionIdGenerator', () => {
    expect(generateMcpAppRoute(baseConfig)).toContain('sessionIdGenerator: () => randomUUID()')
  })

  it('exports OPTIONS, GET, POST, and DELETE handlers', () => {
    const output = generateMcpAppRoute(baseConfig)
    expect(output).toContain('export async function OPTIONS')
    expect(output).toContain('export async function GET')
    expect(output).toContain('export async function POST')
    expect(output).toContain('export async function DELETE')
  })

  it('includes CORS headers', () => {
    const output = generateMcpAppRoute(baseConfig)
    expect(output).toContain('Access-Control-Allow-Origin')
    expect(output).toContain('mcp-session-id')
  })

  it('POST initializes a new session when no session ID header is present', () => {
    expect(generateMcpAppRoute(baseConfig)).toContain('handleNewSession')
  })

  it('POST returns 404 when session is not found', () => {
    expect(generateMcpAppRoute(baseConfig)).toContain('Session not found')
  })

  it('DELETE closes and removes the session, returns 204', () => {
    const output = generateMcpAppRoute(baseConfig)
    expect(output).toContain('.close()')
    expect(output).toContain('status: 204')
  })

  it('registers the resource URI and tool name from config', () => {
    const output = generateMcpAppRoute(baseConfig)
    expect(output).toContain('ui://my-app')
    expect(output).toContain('my_app_tool')
    expect(output).toContain('MyApp')
  })

  it('uses text/html;profile=mcp-app MIME type', () => {
    expect(generateMcpAppRoute(baseConfig)).toContain('text/html;profile=mcp-app')
  })

  it('puts _meta.ui.resourceUri in the tool definition, not the result', () => {
    const output = generateMcpAppRoute(baseConfig)
    expect(output).toContain('registerTool')
    expect(output).toContain("'ui/resourceUri'")
    // _meta must NOT appear inside the return value
    const returnIdx = output.indexOf('return {')
    const metaIdx = output.indexOf('_meta')
    expect(metaIdx).toBeGreaterThanOrEqual(0)
    expect(metaIdx).toBeLessThan(returnIdx)
  })

  it('reads the UI bundle from the configured path', () => {
    expect(generateMcpAppRoute(baseConfig)).toContain('public/mcp-apps/my-app/index.html')
  })

  it('includes auth stub when auth is false', () => {
    expect(generateMcpAppRoute(baseConfig)).toContain('TODO: bring your own auth')
  })

  it('includes auth guard and import when auth is true', () => {
    const output = generateMcpAppRoute({ ...baseConfig, auth: true })
    expect(output).toContain("import { auth } from '@/auth'")
    expect(output).toContain('Unauthorized')
    expect(output).not.toContain('TODO: bring your own auth')
  })

  it('includes state TODO comment when includeState is false', () => {
    expect(generateMcpAppRoute(baseConfig)).toContain('TODO: add your own state')
  })

  it('does not import state when includeState is false', () => {
    expect(generateMcpAppRoute(baseConfig)).not.toContain('getState')
  })

  it('imports and uses state when includeState is true', () => {
    const output = generateMcpAppRoute(withState)
    expect(output).toContain("import { getState, setState } from '@/lib/mcp-my-app-state'")
    expect(output).toContain("getState<string>('last-input')")
    expect(output).toContain("setState('last-input', input)")
    expect(output).not.toContain('TODO: add your own state')
  })

  it('derives correct names for product-catalog', () => {
    const config: McpAppConfig = {
      ...baseConfig,
      appName: 'product-catalog',
      appNameSnake: 'product_catalog',
      appNamePascal: 'ProductCatalog',
      paths: { ...baseConfig.paths, uiBundle: 'public/mcp-apps/product-catalog/index.html' },
    }
    const output = generateMcpAppRoute(config)
    expect(output).toContain('ui://product-catalog')
    expect(output).toContain('product_catalog_tool')
    expect(output).toContain('ProductCatalog')
  })

  it('snapshot — no auth, no state', () => {
    expect(generateMcpAppRoute(baseConfig)).toMatchSnapshot()
  })

  it('snapshot — with auth and state', () => {
    expect(generateMcpAppRoute({ ...withState, auth: true })).toMatchSnapshot()
  })
})

describe('generateMcpAppUiBundle', () => {
  it('returns HTML with CDN import for ext-apps App and PostMessageTransport', () => {
    const output = generateMcpAppUiBundle(baseConfig)
    expect(output).toContain('https://esm.sh/@modelcontextprotocol/ext-apps')
    expect(output).toContain('App, PostMessageTransport')
  })

  it('calls app.connect with PostMessageTransport', () => {
    expect(generateMcpAppUiBundle(baseConfig)).toContain('app.connect(new PostMessageTransport')
  })

  it('includes the Vite upgrade note', () => {
    expect(generateMcpAppUiBundle(baseConfig)).toContain('vite-plugin-singlefile')
  })

  it('calls app.callServerTool with the correct tool name', () => {
    expect(generateMcpAppUiBundle(baseConfig)).toContain("app.callServerTool({ name: 'my_app_tool'")
  })

  it('uses the app name in the title', () => {
    expect(generateMcpAppUiBundle(baseConfig)).toContain('<title>my-app</title>')
  })

  it('uses correct tool name for product-catalog', () => {
    const config: McpAppConfig = {
      ...baseConfig,
      appName: 'product-catalog',
      appNameSnake: 'product_catalog',
      appNamePascal: 'ProductCatalog',
      paths: { ...baseConfig.paths, uiBundle: 'public/mcp-apps/product-catalog/index.html' },
    }
    expect(generateMcpAppUiBundle(config)).toContain("app.callServerTool({ name: 'product_catalog_tool'")
  })

  it('snapshot — default my-app', () => {
    expect(generateMcpAppUiBundle(baseConfig)).toMatchSnapshot()
  })
})

describe('generateMcpAppState', () => {
  it('exports generic getState and setState functions', () => {
    const output = generateMcpAppState(baseConfig)
    expect(output).toContain('export function getState<T>')
    expect(output).toContain('export function setState<T>')
  })

  it('uses a module-level Map<string, unknown>', () => {
    expect(generateMcpAppState(baseConfig)).toContain('new Map<string, unknown>()')
  })

  it('getState casts to T via unknown', () => {
    expect(generateMcpAppState(baseConfig)).toContain('as T | undefined')
  })

  it('snapshot', () => {
    expect(generateMcpAppState(baseConfig)).toMatchSnapshot()
  })
})
