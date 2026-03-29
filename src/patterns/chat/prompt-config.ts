import * as clack from '@clack/prompts'
import process from 'node:process'
import { getRegistry } from '../../registry/index.js'
import { promptPath } from '../../utils/prompt-path.js'
import type { AddChatOptions, ComponentId, OutputPaths, SharedConfig, StorageEntry, WingmanConfig } from '../../types.js'

function resolveComponentsFromFlags(opts: AddChatOptions): ComponentId[] | null {
  const hasComponentFlags =
    opts.storage !== undefined ||
    opts.auth !== undefined ||
    opts.page !== undefined ||
    opts.chatUi !== undefined

  if (!hasComponentFlags && !opts.yes) return null

  const set = new Set<ComponentId>(['api-route', 'chat-ui', 'page-component'])

  if (opts.storage) set.add('storage')
  if (opts.auth === true) set.add('auth')
  if (opts.auth === false) set.delete('auth')
  if (opts.page === false) set.delete('page-component')
  if (opts.chatUi === false) { set.delete('chat-ui'); set.delete('page-component') }

  return [...set]
}

async function promptComponents(opts: AddChatOptions): Promise<ComponentId[]> {
  const fromFlags = resolveComponentsFromFlags(opts)
  let components: ComponentId[]

  if (fromFlags !== null) {
    components = fromFlags
  } else {
    const selected = await clack.multiselect<ComponentId>({
      message: 'Which components do you want to scaffold?',
      options: [
        { value: 'api-route', label: 'API Route', hint: 'required' },
        { value: 'chat-ui', label: 'Chat UI', hint: 'via ai-elements' },
        { value: 'page-component', label: 'Page Component', hint: 'requires Chat UI' },
        { value: 'storage', label: 'Storage', hint: 'conversation persistence' },
        { value: 'auth', label: 'Auth', hint: 'NextAuth v5' },
      ],
      initialValues: ['api-route', 'chat-ui', 'page-component'],
      required: true,
    })

    if (clack.isCancel(selected)) { clack.cancel('Cancelled.'); process.exit(0) }
    components = selected as ComponentId[]
  }

  if (components.includes('page-component') && !components.includes('chat-ui')) {
    clack.log.warn('Page Component requires Chat UI — adding Chat UI.')
    components = [...components, 'chat-ui']
  }

  return components
}

export async function promptChatConfig(shared: SharedConfig, opts: AddChatOptions = {}): Promise<WingmanConfig> {
  const registry = getRegistry()
  const { pathAlias, hasSrcDir, packageManager, targetDir, prereqs } = shared
  const src = hasSrcDir ? 'src/' : ''

  let activeComponents = await promptComponents(opts)

  const apiRouteMessage = prereqs.hasNext
    ? 'API route output path'
    : 'API route output path\n(Next.js not detected — the generated route targets App Router; verify the path fits your setup)'

  const apiRouteResult = await promptPath(
    apiRouteMessage,
    `${src}app/api/chat/route.ts`,
    targetDir,
    { ...(opts.apiRoute && { prefill: opts.apiRoute }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
  )
  if (apiRouteResult.skip) {
    activeComponents = activeComponents.filter((c) => c !== 'api-route')
  }

  const paths: OutputPaths = { apiRoute: apiRouteResult.value }
  const pathOverwrites: Partial<Record<keyof OutputPaths, boolean>> = {
    apiRoute: apiRouteResult.overwrite,
  }

  // Storage is always in-memory — no backend selection needed.
  // Replace the generated storage.ts with your own DB implementation.
  const storage: StorageEntry = registry.storage[0]!
  if (activeComponents.includes('storage')) {
    const storageResult = await promptPath(
      'Storage output path',
      `${src}lib/storage.ts`,
      targetDir,
      { ...(opts.storagePath && { prefill: opts.storagePath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
    )
    if (storageResult.skip) {
      activeComponents = activeComponents.filter((c) => c !== 'storage')
    } else {
      paths.storage = storageResult.value
      pathOverwrites.storage = storageResult.overwrite
    }
  }

  if (activeComponents.includes('page-component')) {
    const routeSegments = apiRouteResult.value
      .replace(/^src\//, '')
      .replace(/^app\//, '')
      .replace(/^api\//, '')
      .split('/')
      .slice(0, -1)
      .join('/')
    const defaultPagePath = `${src}app/${routeSegments}/page.tsx`
    const pageResult = await promptPath(
      'Page component output path',
      defaultPagePath,
      targetDir,
      { ...(opts.pagePath && { prefill: opts.pagePath }), ...(opts.overwrite && { overwrite: true }), ...(opts.yes && { yes: true }) }
    )
    if (pageResult.skip) {
      activeComponents = activeComponents.filter((c) => c !== 'page-component')
    } else {
      paths.pageComponent = pageResult.value
      pathOverwrites.pageComponent = pageResult.overwrite
    }
  }

  let auth = false
  if (activeComponents.includes('auth')) {
    if (opts.auth !== undefined) {
      auth = opts.auth
    } else if (opts.yes) {
      auth = true
    } else {
      const wantsAuth = await clack.confirm({
        message: 'Add NextAuth v5 authentication?',
        initialValue: false,
      })
      if (clack.isCancel(wantsAuth)) { clack.cancel('Cancelled.'); process.exit(0) }
      auth = wantsAuth === true
    }
    if (!auth) activeComponents = activeComponents.filter((c) => c !== 'auth')
  }

  let includeInterrupt = false
  if (opts.interrupt !== undefined) {
    includeInterrupt = opts.interrupt
  } else if (!opts.yes) {
    const wantsInterrupt = await clack.confirm({
      message: 'Include human-in-the-loop interrupt approval?',
      initialValue: false,
    })
    if (clack.isCancel(wantsInterrupt)) { clack.cancel('Cancelled.'); process.exit(0) }
    includeInterrupt = wantsInterrupt === true
  }

  if (includeInterrupt) {
    paths.interruptToolsFile = `${src}lib/interrupt-tools.ts`
    paths.approvalWidgetFile = `${src}components/approval-widget.tsx`
  }

  return {
    components: activeComponents,
    provider: shared.provider,
    storage,
    auth,
    pathAlias,
    hasSrcDir,
    packageManager,
    paths,
    pathOverwrites,
    targetDir,
    includeInterrupt,
  }
}
