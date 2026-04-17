import type { PackageManager } from './utils/detect-package-manager.js'

export type { PackageManager }

// ---------------------------------------------------------------------------
// Composable pattern architecture
// ---------------------------------------------------------------------------

/** Config collected once before any pattern-specific prompts. */
export interface SharedConfig {
  provider: ProviderEntry
  pathAlias: string
  hasSrcDir: boolean
  packageManager: PackageManager
  targetDir: string
  prereqs: { hasShadcn: boolean; hasNext: boolean }
}

/** A single entry in the execution plan (display + execution metadata). */
export type PlanEntry =
  | { kind: 'run';    command: string; args: string[] }
  | { kind: 'create'; path: string; overwrite?: boolean }

/** Unified plan produced by the planner across all requested patterns. */
export interface ExecutionPlan {
  /** Deduplicated package names to install before execution. */
  packages: string[]
  /** Ordered entries: CLI runs first, then file creates. */
  entries: PlanEntry[]
  /** Per-pattern groups used for display — same entries as above, grouped by pattern id. */
  groups: Array<{ patternId: string; entries: PlanEntry[] }>
}

/** Every pattern implements this interface. */
export interface Pattern {
  id: string
  description: string
  /** Non-universal CLI flags this pattern accepts (beyond provider, auth, overwrite, yes). */
  cliFlags: (keyof AddChatOptions)[]
  promptConfig(shared: SharedConfig, opts: unknown): Promise<unknown>
  getPackages(config: unknown): string[]
  getPlanEntries(config: unknown): PlanEntry[]
  getEnvVars(config: unknown): string[]
  execute(config: unknown, shared: SharedConfig): Promise<void>
}

export interface ProviderEntry {
  id: 'anthropic' | 'openai' | 'google'
  label: string
  package: string
  importName: string
  envVar: string
  defaultModel: string
  modelFactory: string
  /** Method name on the provider for embedding models (e.g. 'embedding' for openai, 'textEmbeddingModel' for google). Absent if the provider has no native embedding support. */
  embeddingMethod?: string
  /** Method name on the provider for speech generation (e.g. 'speech' for openai). Absent if unsupported. */
  speechMethod?: string
  /** Method name on the provider for speech transcription (e.g. 'transcription' for openai). Absent if unsupported. */
  transcriptionMethod?: string
}

export interface StorageEntry {
  id: 'memory' | 'postgres'
  label: string
  package?: string
  envVar?: string
}

export interface StackRegistry {
  providers: ProviderEntry[]
  storage: StorageEntry[]
}

export type ComponentId = 'api-route' | 'chat-ui' | 'page-component' | 'storage' | 'auth'

export interface OutputPaths {
  apiRoute: string
  storage?: string
  pageComponent?: string
  interruptToolsFile?: string
  approvalWidgetFile?: string
}

export interface WingmanConfig {
  components: ComponentId[]
  provider: ProviderEntry
  storage: StorageEntry
  auth: boolean
  paths: OutputPaths
  pathOverwrites: Partial<Record<keyof OutputPaths, boolean>>
  targetDir: string
  /** Import alias prefix from tsconfig, e.g. '~/' or '~/' */
  pathAlias: string
  /** Whether the project uses a src/ directory layout */
  hasSrcDir: boolean
  /** Package manager detected in the project */
  packageManager: PackageManager
  /** Whether to include human-in-the-loop interrupt approval */
  includeInterrupt?: boolean
}

/** Values parsed from CLI flags — undefined means "not supplied, prompt the user" */
export interface AddChatOptions {
  /** anthropic | openai | google */
  provider?: string
  /** memory | postgres — presence implies storage component included (default: off) */
  storage?: string
  /** true = --auth (default: off) */
  auth?: boolean
  /** false = --no-page */
  page?: boolean
  /** false = --no-chat-ui */
  chatUi?: boolean
  /** override API route output path */
  apiRoute?: string
  /** override storage output path */
  storagePath?: string
  /** override page component output path */
  pagePath?: string
  /** overwrite existing files without prompting */
  overwrite?: boolean
  /** accept all defaults, skip optional prompts */
  yes?: boolean
  // structured-output flags
  /** schema/hook/type name (default: output) */
  schemaName?: string
  /** override schema output path */
  schemaPath?: string
  /** override hook output path */
  hookPath?: string
  /** false = --no-hook */
  hook?: boolean
  /** true = --interrupt */
  interrupt?: boolean
  // rag + hybrid-search flags
  /** embedding model ID */
  embeddingModel?: string
  // image-gen flags
  /** image model: dall-e-3 | dall-e-2 (default: dall-e-3) */
  imageModel?: string
  // generative-ui flags
  /** override API route output path (generative-ui) */
  routePath?: string
  // mcp-app flags
  /** kebab-case app name (default: my-app) */
  appName?: string
  /** false = --no-state (skip state store) */
  state?: boolean
  /** override state module output path */
  statePath?: string
  /** override UI bundle output path */
  uiBundle?: string
}

// ---------------------------------------------------------------------------
// structured-output pattern
// ---------------------------------------------------------------------------

export interface StructuredOutputConfig {
  schemaName: string
  auth: boolean
  paths: {
    apiRoute: string
    schema: string
    hook?: string
  }
  pathOverwrites: {
    apiRoute?: boolean
    schema?: boolean
    hook?: boolean
  }
  provider: ProviderEntry
  pathAlias: string
  targetDir: string
}

// ---------------------------------------------------------------------------
// tools pattern
// ---------------------------------------------------------------------------

export interface ToolsConfig {
  toolName: string
  auth: boolean
  paths: {
    apiRoute: string
    toolsFile: string
  }
  pathOverwrites: { apiRoute?: boolean; toolsFile?: boolean }
  provider: ProviderEntry
  pathAlias: string
  targetDir: string
}

// ---------------------------------------------------------------------------
// stream-object pattern
// ---------------------------------------------------------------------------

export interface StreamObjectConfig {
  schemaName: string
  auth: boolean
  paths: {
    apiRoute: string
    schema: string
    hook?: string
  }
  pathOverwrites: { apiRoute?: boolean; schema?: boolean; hook?: boolean }
  schemaAlreadyExists: boolean
  provider: ProviderEntry
  pathAlias: string
  targetDir: string
}

// ---------------------------------------------------------------------------
// rag pattern
// ---------------------------------------------------------------------------

export type RagStorage = 'memory' | 'pgvector' | 'sqlite'

export interface RagPatternConfig {
  storage: RagStorage
  embeddingModel: string
  stream: boolean
  auth: boolean
  provider: ProviderEntry
  pathAlias: string
  targetDir: string
  chunkSize: number
  paths: {
    embedRoute: string
    queryRoute: string
    store: string
    memoryStore: string
    pgvectorStore?: string
    schemaSql?: string
    sqliteStore?: string
    chunker?: string
    hook: string
  }
  pathOverwrites: Partial<Record<'embedRoute' | 'queryRoute' | 'store' | 'memoryStore' | 'pgvectorStore' | 'schemaSql' | 'sqliteStore' | 'chunker' | 'hook', boolean>>
}

// ---------------------------------------------------------------------------
// agent pattern
// ---------------------------------------------------------------------------

export interface AgentConfig {
  agentName: string
  auth: boolean
  includePage: boolean
  paths: {
    apiRoute: string
    toolsFile: string
    storage: string
    page?: string
  }
  pathOverwrites: {
    apiRoute?: boolean
    toolsFile?: boolean
    storage?: boolean
    page?: boolean
  }
  provider: ProviderEntry
  pathAlias: string
  hasSrcDir: boolean
  packageManager: PackageManager
  targetDir: string
}

// ---------------------------------------------------------------------------
// audio pattern
// ---------------------------------------------------------------------------

export interface AudioConfig {
  includeTranscribe: boolean
  includeSpeech: boolean
  includePage: boolean
  auth: boolean
  paths: {
    transcribeRoute?: string
    speechRoute?: string
    page?: string
  }
  pathOverwrites: {
    transcribeRoute?: boolean
    speechRoute?: boolean
    page?: boolean
  }
  provider: ProviderEntry
  pathAlias: string
  hasSrcDir: boolean
  packageManager: PackageManager
  targetDir: string
}

// ---------------------------------------------------------------------------
// eval pattern
// ---------------------------------------------------------------------------

export interface EvalConfig {
  /** When true, generate dataset + runner instead of the inline eval script */
  useDataset: boolean
  /** When true, generate a GitHub Actions CI workflow */
  includeWorkflow: boolean
  paths: {
    /** Used when useDataset is false */
    evalScript?: string
    /** Used when useDataset is true */
    dataset?: string
    /** Used when useDataset is true */
    runner?: string
    /** Relative path from runner to dataset — computed at prompt time */
    datasetRelativeFromRunner?: string
    /** Used when includeWorkflow is true */
    workflow?: string
  }
  pathOverwrites: {
    evalScript?: boolean
    dataset?: boolean
    runner?: boolean
    workflow?: boolean
  }
  provider: ProviderEntry
  pathAlias: string
  targetDir: string
}

// ---------------------------------------------------------------------------
// multimodal pattern
// ---------------------------------------------------------------------------

export interface MultimodalConfig {
  auth: boolean
  includePage: boolean
  paths: {
    apiRoute: string
    page?: string
  }
  pathOverwrites: {
    apiRoute?: boolean
    page?: boolean
  }
  provider: ProviderEntry
  pathAlias: string
  hasSrcDir: boolean
  packageManager: PackageManager
  targetDir: string
}

// ---------------------------------------------------------------------------
// document-processing pattern
// ---------------------------------------------------------------------------

export interface DocumentProcessingConfig {
  schemaName: string
  auth: boolean
  paths: {
    apiRoute: string
    schema: string
    hook?: string
  }
  pathOverwrites: {
    apiRoute?: boolean
    schema?: boolean
    hook?: boolean
  }
  provider: ProviderEntry
  pathAlias: string
  targetDir: string
}

// ---------------------------------------------------------------------------
// generative-ui pattern
// ---------------------------------------------------------------------------

export interface GenerativeUiConfig {
  auth: boolean
  paths: {
    apiRoute: string
    page: string
  }
  pathOverwrites: {
    apiRoute?: boolean
    page?: boolean
  }
  provider: ProviderEntry
  pathAlias: string
  hasSrcDir: boolean
  packageManager: PackageManager
  targetDir: string
}

// ---------------------------------------------------------------------------
// memory pattern
// ---------------------------------------------------------------------------

export interface MemoryConfig {
  embeddingModel: string
  auth: boolean
  paths: {
    saveRoute: string
    retrieveRoute: string
    store: string
    inject: string
  }
  pathOverwrites: {
    saveRoute?: boolean
    retrieveRoute?: boolean
    store?: boolean
    inject?: boolean
  }
  provider: ProviderEntry
  pathAlias: string
  targetDir: string
}

// ---------------------------------------------------------------------------
// hybrid-search pattern
// ---------------------------------------------------------------------------

export interface HybridSearchConfig {
  embeddingModel: string
  auth: boolean
  paths: {
    apiRoute: string
    bm25: string
    reranker: string
    hybridStore: string
  }
  pathOverwrites: {
    apiRoute?: boolean
    bm25?: boolean
    reranker?: boolean
    hybridStore?: boolean
  }
  provider: ProviderEntry
  pathAlias: string
  targetDir: string
}

// ---------------------------------------------------------------------------
// content-moderation pattern
// ---------------------------------------------------------------------------

export interface ContentModerationConfig {
  auth: boolean
  paths: {
    apiRoute: string
    policy: string
  }
  pathOverwrites: {
    apiRoute?: boolean
    policy?: boolean
  }
  provider: ProviderEntry
  pathAlias: string
  targetDir: string
}

// ---------------------------------------------------------------------------
// image-gen pattern
// ---------------------------------------------------------------------------

export interface ImageGenConfig {
  imageModel: string
  auth: boolean
  includePage: boolean
  paths: {
    apiRoute: string
    page?: string
  }
  pathOverwrites: {
    apiRoute?: boolean
    page?: boolean
  }
  pathAlias: string
  hasSrcDir: boolean
  packageManager: PackageManager
  targetDir: string
}

// ---------------------------------------------------------------------------
// eval-dataset pattern — REMOVED (merged into EvalConfig)
// ---------------------------------------------------------------------------

/** @deprecated Use EvalConfig with useDataset: true instead */
export type EvalDatasetConfig = EvalConfig

// ---------------------------------------------------------------------------
// background-agent pattern
// ---------------------------------------------------------------------------

export interface BackgroundAgentConfig {
  auth: boolean
  paths: {
    enqueueRoute: string
    statusRoute: string
    worker: string
    jobStore: string
  }
  pathOverwrites: {
    enqueueRoute?: boolean
    statusRoute?: boolean
    worker?: boolean
    jobStore?: boolean
  }
  provider: ProviderEntry
  pathAlias: string
  hasSrcDir: boolean
  packageManager: PackageManager
  targetDir: string
}

// ---------------------------------------------------------------------------
// multi-agent pattern
// ---------------------------------------------------------------------------

export interface MultiAgentConfig {
  auth: boolean
  paths: {
    apiRoute: string
    specialists: string
    handoffTools: string
    types: string
  }
  pathOverwrites: {
    apiRoute?: boolean
    specialists?: boolean
    handoffTools?: boolean
    types?: boolean
  }
  provider: ProviderEntry
  pathAlias: string
  hasSrcDir: boolean
  packageManager: PackageManager
  targetDir: string
}

// ---------------------------------------------------------------------------
// mcp-app pattern
// ---------------------------------------------------------------------------

export interface McpAppConfig {
  appName: string        // kebab-case, e.g. "my-app"
  appNameSnake: string   // snake_case for tool names, e.g. "my_app"
  appNamePascal: string  // PascalCase for McpServer name, e.g. "MyApp"
  auth: boolean
  includeState: boolean
  paths: {
    apiRoute: string     // e.g. "app/api/mcp/route.ts"
    uiBundle: string     // e.g. "public/mcp-apps/my-app/index.html"
    state?: string       // e.g. "lib/mcp-my-app-state.ts" — present iff includeState
  }
  pathOverwrites: { apiRoute?: boolean; uiBundle?: boolean; state?: boolean }
  pathAlias: string
  targetDir: string
}

// ---------------------------------------------------------------------------
// interrupt pattern
// ---------------------------------------------------------------------------

export interface InterruptPatternConfig {
  provider: ProviderEntry
  paths: {
    apiRoute: string
    tools: string
    component: string
    page?: string
  }
  pathOverwrites: { apiRoute?: boolean; tools?: boolean; component?: boolean; page?: boolean }
  includePage: boolean
  pathAlias: string
  hasSrcDir: boolean
  packageManager: PackageManager
  targetDir: string
}
