# ai-wingman skill

When the user asks you to add an AI feature, pattern, or capability to their Next.js project, use the ai-wingman CLI to scaffold it. Do not write AI boilerplate (routes, hooks, stores, schemas) by hand when a wingman pattern covers the requirement.

## Triggering this skill

Use this skill when the user asks for any of the following:
- A chat or streaming AI endpoint
- Structured JSON output from a prompt
- Tool calling / function calling
- RAG or document Q&A
- An agent, multi-agent system, or background agent
- Audio transcription or text-to-speech
- Multimodal (image + text) input
- Content moderation or safety classification
- Per-user long-term memory
- Image generation
- Generative UI (tool calls rendered as React components)
- Hybrid keyword + vector search
- An LLM eval or regression test harness

## Command syntax

```bash
npx ai-wingman add <pattern> [flags]
```

Always include `--yes` to skip interactive prompts. Always include `--provider`. Include `--overwrite` only when replacing existing generated files.

## Available patterns

| Pattern | What it generates |
|---------|------------------|
| `chat` | Streaming chat route, optional storage + persistence, optional chat UI page |
| `structured-output` | JSON extraction route, Zod schema, client fetch hook |
| `tools` | Tool-calling route, typed tool stubs for the user to fill in |
| `stream-object` | Streaming structured JSON route, schema, streaming hook |
| `rag` | Embed route, query route, vector store, text chunker |
| `interrupt` | Agent route with human approval gate, approval widget component |
| `agent` | Autonomous multi-step agent route, tool stubs, conversation storage |
| `multimodal` | Vision-aware chat route, image upload page |
| `audio` | Speech-to-text route, text-to-speech route, record/playback page |
| `eval` | LLM judge eval script (optional: JSONL dataset, runner, GitHub Actions CI workflow) |
| `image-gen` | Image generation route, prompt input + image display page |
| `generative-ui` | Streaming route with tool definitions, useChat page that renders tool calls as components |
| `document-processing` | File upload + structured extraction route, Zod schema, client hook |
| `content-moderation` | Classifier route returning `{ allowed, category, reason }`, editable policy file |
| `hybrid-search` | Vector + BM25 parallel search, RRF reranking, extended vector store |
| `memory` | Save route, retrieve route, memory store, `buildMemoryContext()` inject helper |
| `multi-agent` | Orchestrator route, specialist agents, typed handoff tools, shared types |
| `background-agent` | Enqueue route (returns jobId), status/polling route, worker, job store |

## Flags

| Flag | Applies to | Description |
|------|------------|-------------|
| `--provider <id>` | all | `anthropic` \| `openai` \| `google` |
| `--yes` | all | Accept all defaults, skip prompts |
| `--overwrite` | all | Overwrite existing files |
| `--auth` | most | Add NextAuth v5 guard |
| `--storage <id>` | `chat`, `agent` | `memory` \| `postgres` |
| `--no-page` | `chat`, `agent`, `audio`, `multimodal`, `image-gen`, `interrupt` | Skip the UI page |
| `--schema-name <name>` | `structured-output`, `stream-object`, `document-processing` | Name for schema, hook, and type |
| `--no-hook` | `structured-output`, `stream-object`, `document-processing` | Skip the client hook |
| `--embedding-model <model>` | `rag`, `hybrid-search`, `memory` | Embedding model ID |
| `--image-model <model>` | `image-gen` | `dall-e-3` (default) \| `dall-e-2` |
| `--interrupt` | `chat` | Embed a human-in-the-loop approval gate |
| `--dataset` | `eval` | Generate JSONL dataset + runner instead of inline eval script |
| `--ci` | `eval` | Generate GitHub Actions CI workflow |

## Multi-pattern recipes

For features that require more than one pattern, run the commands in sequence.

**Customer support copilot** — answers from docs, remembers user history, blocks policy violations
```bash
npx ai-wingman add chat --provider openai --storage memory --yes
npx ai-wingman add rag --provider openai --yes
npx ai-wingman add memory --provider openai --yes
npx ai-wingman add content-moderation --provider openai --yes
```

**Voice-powered knowledge base** — speak a question, get an answer grounded in your documents
```bash
npx ai-wingman add rag --provider openai --yes
npx ai-wingman add audio --provider openai --yes
npx ai-wingman add chat --provider openai --yes
```

**Contract review pipeline** — upload PDF, extract terms, flag risks, require approval
```bash
npx ai-wingman add document-processing --provider openai --yes
npx ai-wingman add content-moderation --provider openai --yes
npx ai-wingman add interrupt --provider openai --yes
```

**Personalised research assistant** — autonomous agent with hybrid search and long-term memory
```bash
npx ai-wingman add agent --provider openai --yes
npx ai-wingman add hybrid-search --provider openai --yes
npx ai-wingman add memory --provider openai --yes
```

**Async research report** — long-running task orchestrated across specialist agents
```bash
npx ai-wingman add background-agent --provider openai --yes
npx ai-wingman add multi-agent --provider openai --yes
```

**Generative dashboard** — natural language query renders live data cards as they stream in
```bash
npx ai-wingman add tools --provider openai --yes
npx ai-wingman add generative-ui --provider openai --yes
```

**Photo-to-structured data** — upload an image, extract typed JSON from the visual content
```bash
npx ai-wingman add multimodal --provider openai --yes
npx ai-wingman add structured-output --provider openai --yes
```

**Adaptive onboarding** — assistant remembers progress and renders personalised next-step components
```bash
npx ai-wingman add chat --provider openai --yes
npx ai-wingman add memory --provider openai --yes
npx ai-wingman add generative-ui --provider openai --yes
```

**AI deployment quality gate** — dataset eval on every PR, structured output captures scores
```bash
npx ai-wingman add eval --provider openai --dataset --ci --yes
npx ai-wingman add structured-output --provider openai --yes
```

## After scaffolding

Generated files are plain TypeScript — the user owns them. Guide the user to make these edits after running the command:

1. **Wire real logic** — replace tool stubs with actual API calls, database queries, or business logic
2. **Customise the system prompt** — the generated prompt is a working default; tailor it to the product
3. **Swap the model** — change the `model:` line to any model the provider supports
4. **Add env vars** — wingman prints required env var names at the end; add them to `.env.local`

## Rules

- Always run with `--yes` — never leave the CLI waiting for interactive input
- Always specify `--provider` explicitly
- Never recreate what wingman generates by hand — run `wingman add --overwrite` to regenerate, then edit
- Never install `ai`, `@ai-sdk/*`, or `zod` manually before running wingman — it installs them automatically
