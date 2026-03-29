import * as clack from '@clack/prompts'
import process from 'node:process'
import { promptPath } from '../../utils/prompt-path.js'
import type { AgentConfig, SharedConfig } from '../../types.js'

interface AddAgentOptions {
  agentName?: string
  apiRoute?: string
  toolsPath?: string
  storagePath?: string
  pagePath?: string
  page?: boolean
  auth?: boolean
  overwrite?: boolean
  yes?: boolean
}

function toKebabCase(camel: string): string {
  return camel.replace(/([A-Z])/g, '-$1').toLowerCase()
}

export async function promptAgentConfig(
  shared: SharedConfig,
  opts: AddAgentOptions = {}
): Promise<AgentConfig> {
  const { pathAlias, hasSrcDir, targetDir, packageManager } = shared
  const src = hasSrcDir ? 'src/' : ''

  // Agent name
  let agentName = 'myAgent'
  if (opts.agentName) {
    agentName = opts.agentName
  } else if (!opts.yes) {
    const input = await clack.text({
      message: 'Agent name?',
      initialValue: 'myAgent',
      validate(value) {
        if (!value?.trim()) return 'Agent name is required'
        if (!/^[a-z][a-zA-Z0-9]*$/.test(value.trim())) return 'Use camelCase (e.g. researchAgent, codeAgent)'
        return undefined
      },
    })
    if (clack.isCancel(input)) { clack.cancel('Cancelled.'); process.exit(0) }
    agentName = String(input).trim()
  }

  const kebabName = toKebabCase(agentName)

  // API route path
  const apiRouteResult = await promptPath(
    'API route output path',
    `${src}app/api/agent/route.ts`,
    targetDir,
    { ...(opts.apiRoute && { prefill: opts.apiRoute }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  // Tools file path
  const toolsFileResult = await promptPath(
    'Agent tools file output path',
    `${src}lib/agent-tools/${kebabName}.tools.ts`,
    targetDir,
    { ...(opts.toolsPath && { prefill: opts.toolsPath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  // Storage path
  const storageResult = await promptPath(
    'Agent storage file output path',
    `${src}lib/agent-storage.ts`,
    targetDir,
    { ...(opts.storagePath && { prefill: opts.storagePath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )

  // Page component
  let includePage = true
  if (opts.page !== undefined) {
    includePage = opts.page
  } else if (!opts.yes) {
    const wantsPage = await clack.confirm({
      message: 'Generate a page component?',
      initialValue: true,
    })
    if (clack.isCancel(wantsPage)) { clack.cancel('Cancelled.'); process.exit(0) }
    includePage = wantsPage === true
  }

  let pageResult: { value: string; overwrite?: boolean } | null = null
  if (includePage) {
    pageResult = await promptPath(
      'Page component output path',
      `${src}app/agent/page.tsx`,
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
    agentName,
    auth,
    includePage,
    paths: {
      apiRoute: apiRouteResult.value,
      toolsFile: toolsFileResult.value,
      storage: storageResult.value,
      ...(pageResult && { page: pageResult.value }),
    },
    pathOverwrites: {
      ...(apiRouteResult.overwrite && { apiRoute: true }),
      ...(toolsFileResult.overwrite && { toolsFile: true }),
      ...(storageResult.overwrite && { storage: true }),
      ...(pageResult?.overwrite && { page: true }),
    },
    provider: shared.provider,
    pathAlias,
    hasSrcDir,
    packageManager,
    targetDir,
  }
}
