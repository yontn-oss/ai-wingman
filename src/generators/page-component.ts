import type { WingmanConfig } from '../types.js'
import { read, render, inject } from '../utils/template.js'

function deriveApiPath(outputPath: string): string {
  // src/app/api/chat/route.ts -> /api/chat
  // app/api/chat/route.ts    -> /api/chat
  return '/' + outputPath
    .replace(/^src\//, '')
    .replace(/^app\//, '')
    .replace(/\/route\.tsx?$/, '')
}

export function generatePageComponent(config: WingmanConfig): string {
  const apiPath = deriveApiPath(config.paths.apiRoute)
  const a = config.pathAlias
  const hasStorage = config.components.includes('storage')
  const hasInterrupt = config.includeInterrupt === true

  const approvalWidgetImportPath = (() => {
    if (!hasInterrupt) return ''
    const filePath = config.paths.approvalWidgetFile ?? 'components/approval-widget.tsx'
    const withoutExt = filePath.replace(/\.tsx?$/, '')
    const withoutSrc = withoutExt.replace(/^src\//, '')
    return a + withoutSrc
  })()

  if (hasStorage) {
    let t = read('page-component-storage.tsx')
    t = render(t, {
      __PATH_ALIAS__: a,
      __API_PATH__: apiPath,
    })
    return t
  }

  // Base template (handles both plain and interrupt variants)
  let t = read('page-component.tsx')
  t = render(t, {
    __PATH_ALIAS__: a,
    __API_PATH__: apiPath,
    __USE_CHAT_DESTRUCTURE__: hasInterrupt
      ? '{ messages, sendMessage, status, regenerate, addToolApprovalResponse }'
      : '{ messages, sendMessage, status, regenerate }',
  })
  t = inject(t, 'APPROVAL_IMPORT', hasInterrupt
    ? `import { ApprovalWidget } from '${approvalWidgetImportPath}'`
    : ''
  )
  // APPROVAL_WIDGET marker is on the same line as </Conversation> (no blank line before it).
  // With approval: inject leading \n + widget so there's a blank line between </Conversation> and widget
  // Without: inject '' to remove — leaving just the \n\n before <PromptInput>
  t = inject(t, 'APPROVAL_WIDGET', hasInterrupt
    ? `\n      <ApprovalWidget messages={messages} addToolApprovalResponse={addToolApprovalResponse} />`
    : ''
  )
  return t
}
