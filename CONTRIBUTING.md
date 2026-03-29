# Contributing to ai-wingman

## Getting started

1. Fork the repo and clone your fork
2. Install dependencies: `pnpm install`
3. Create a feature branch: `git checkout -b feat/your-feature`
4. Make your changes, add tests, verify they pass
5. Push and open a PR against `main`

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`). PRs are squash-merged.

## Local dev loop

```bash
# 1. Build and link the CLI globally (run once)
bash scripts/dev-link.sh

# 2. Start watch mode
pnpm --filter ai-wingman watch

# 3. Create a fresh test project
bash scripts/new-fixture.sh
cd /tmp/wingman-fixture

# 4. Run against it
ai-wingman add chat --provider anthropic --storage memory --yes
```

Or point directly at the built binary from any project:

```bash
node /path/to/wingman/packages/ai-wingman/dist/wingman.js add chat --yes
```

## Tests

```bash
pnpm --filter ai-wingman test
```

525 snapshot tests across all 18 generators. Generators are pure `(config) => string` functions — fast, deterministic, snapshot-tested.

If your change intentionally alters generated output, update snapshots with:

```bash
pnpm --filter ai-wingman test -- --update
```

## Project structure

```
packages/ai-wingman/
├── bin/
│   └── wingman.ts              # CLI entry point (commander)
├── scripts/
│   └── generate-pattern-registry.ts  # Build-time codegen (auto-discovers patterns)
├── src/
│   ├── index.ts                # Library barrel (programmatic API)
│   ├── types.ts                # Shared config types for all 18 patterns
│   ├── defaults.ts             # Magic values injected into generated code
│   ├── registry/
│   │   ├── providers.ts        # Provider configs (Anthropic, OpenAI, Google)
│   │   ├── storage-adapters.ts
│   │   ├── patterns.ts         # AUTO-GENERATED — do not edit manually
│   │   └── index.ts
│   ├── generators/             # Pure (config) => string functions, one per file type
│   ├── templates/              # Raw .ts template files with __SENTINEL__ placeholders
│   ├── patterns/               # One directory per pattern (18 total)
│   ├── commands/
│   │   ├── add/                # Orchestrator: prompt → plan → confirm → execute
│   │   └── list/
│   ├── planner/                # Builds ExecutionPlan before touching the filesystem
│   ├── steps/                  # Shared interactive prompt steps
│   └── utils/
│       ├── template.ts         # read(), render(), inject() for template processing
│       └── validate-flags.ts   # CLI flag validation per pattern
└── tests/
    └── unit/generators/        # Snapshot tests, one file per generator
```

## Build

```bash
pnpm --filter ai-wingman build
```

The build runs two steps:
1. `prebuild` runs `generate:registry` — scans `src/patterns/*/index.ts` and generates `src/registry/patterns.ts`
2. `tsup` builds two entry points: `bin/wingman.ts` (CLI) and `src/index.ts` (library API with `.d.ts`)

Templates in `src/templates/` are copied to `dist/templates/` on build.

## Adding a provider

Add one entry to `src/registry/providers.ts` — no other changes needed:

```ts
{
  id: 'mistral',
  label: 'Mistral',
  package: '@ai-sdk/mistral',
  importName: 'mistral',
  envVar: 'MISTRAL_API_KEY',
  defaultModel: 'mistral-large-latest',
  modelFactory: 'mistral("mistral-large-latest")',
}
```

The prompt and all generators pick it up automatically.

## Adding a pattern

1. Create `src/patterns/<name>/index.ts` exporting a `Pattern` object
   - The export must be named `<camelCaseName>Pattern` (e.g., `myPattern` for `src/patterns/my/`)
   - Include a `cliFlags` array listing any non-universal flags the pattern accepts
2. Add `prompt-config.ts` and `execute.ts` alongside it
3. Add generators to `src/generators/` and templates to `src/templates/` as needed
4. Run `npm run generate:registry` — it picks up the new pattern automatically
5. Add snapshot tests in `tests/unit/generators/<name>.test.ts`

You do **not** need to manually edit `src/registry/patterns.ts` — the codegen script handles it.
