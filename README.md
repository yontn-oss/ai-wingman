<p align="center">
  <img src=".github/logo.svg" alt="ai-wingman logo" width="128" />
</p>

<h1 align="center">ai-wingman</h1>

<p align="center">
  <strong>The right way to wire AI into your Next.js app.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/ai-wingman"><img src="https://img.shields.io/npm/v/ai-wingman.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/ai-wingman"><img src="https://img.shields.io/npm/dm/ai-wingman.svg" alt="npm downloads" /></a>
  <a href="https://github.com/yontn-oss/ai-wingman/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/ai-wingman.svg" alt="license" /></a>
  <a href="https://github.com/yontn-oss/ai-wingman/blob/main/CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome" /></a>
</p>

<p align="center">
  <a href="https://ai-wingman-psi.vercel.app/">Website</a>
</p>

<p align="center">
  <code>npx ai-wingman add chat</code>
</p>

<p align="center">
  ai-wingman writes the API route, UI component, and all the wiring into your existing project — then exits.<br />
  No runtime dependency. No lock-in. Just clean, typed TypeScript you own.
</p>

---

## Table of contents

- [The problem it solves](#the-problem-it-solves)
- [How it works](#how-it-works)
- [18 patterns across 4 categories](#18-patterns-across-4-categories)
- [New to AI development?](#new-to-ai-development)
- [Quick start](#quick-start)
- [Prerequisites](#prerequisites)
- [Under the hood](#under-the-hood)
- [Contributing](#contributing)
- [License](#license)

---

## The problem it solves

Calling an AI API is three lines of code. Shipping a production AI feature is not.

You need to handle streaming tokens to the UI, structure outputs as typed JSON, store conversation history, let the model call your own functions, guard against bad content, measure quality over time, and do it all without turning your codebase into a mess of `fetch` calls and `any` types.

Every team figures this out from scratch. ai-wingman packages 18 of those patterns — each one the right way to wire that use-case — and scaffolds them with a single command.

---

## How it works

```
$ npx ai-wingman add rag
```

```
┌  ai-wingman
│
◆  Next.js 16.2.1 found
│
◇  AI provider?
│  Anthropic
│
◇  RAG storage backend?
│  SQLite + sqlite-vec
│
◇  Embedding model ID?
│  voyage-3
│
◇  Stream the query response?
│  Yes
│
◇  Plan ─────────────────────────╮
│                                │
│  Install packages:             │
│    @ai-sdk/anthropic           │
│    ai                          │
│    better-sqlite3              │
│    sqlite-vec                  │
│                                │
│  Create files:                 │
│    app/api/rag/embed/route.ts  │
│    app/api/rag/query/route.ts  │
│    lib/rag/store.ts            │
│    lib/rag/sqlite-store.ts     │
│    lib/rag/chunker.ts          │
│    hooks/use-rag-query.ts      │
│                                │
├────────────────────────────────╯
│
◇  Proceed?
│  Yes
│
◆  Installed @ai-sdk/anthropic, ai, better-sqlite3, sqlite-vec
│
◆  Created app/api/rag/embed/route.ts
◆  Created app/api/rag/query/route.ts
◆  Created lib/rag/store.ts
◆  Created lib/rag/sqlite-store.ts
◆  Created lib/rag/chunker.ts
◆  Created hooks/use-rag-query.ts
│
◇  Add to .env.local ───────────╮
│                               │
│  ANTHROPIC_API_KEY=           │
│  SQLITE_RAG_PATH=             │
│                               │
├───────────────────────────────╯
│
└  Done! Start your dev server: npm run dev
```

The CLI detects your project, asks targeted questions, shows the full plan before touching anything, installs packages, writes files, and exits. No runtime dependency on ai-wingman after that point.

```
your project
    │
    ▼
◆ detect  ──── Next.js · TypeScript · shadcn/ui
    │
    ▼
◇ prompt  ──── provider · storage · model · options
    │
    ▼
◇ plan    ──── packages to install · files to create
    │
    ▼
◇ confirm ──── review before anything is written
    │
    ▼
◆ execute ──── install · write · done
    │
    ▼
your project + production-ready AI feature
```

---

## 18 patterns across 4 categories

### Generate

Text, images, audio, structured data, and UI — anything the model produces directly.

| Command | What it builds | What that means |
|---------|---------------|-----------------|
| `ai-wingman add chat` | Streaming chat with conversation history | A ChatGPT-style interface backed by your own API route. Responses appear word-by-word instead of all at once. |
| `ai-wingman add structured-output` | AI that returns typed JSON, not prose | Ask the model a question; get back a strongly-typed object with named fields. Ready to store, display, or pass to the next function. |
| `ai-wingman add tools` | AI route that can call your functions | You expose functions like `searchDatabase()` or `sendEmail()`. The model decides when to call them and with what arguments. Your code executes them. |
| `ai-wingman add stream-object` | Progressively streamed typed JSON | The same typed object, but fields fill in one by one as the model generates them — good for long extractions where you want the UI to feel alive. |
| `ai-wingman add multimodal` | Vision-aware chat with image upload | The same chat interface, but users can attach images. The model can see, describe, and reason about them. |
| `ai-wingman add audio` | Speech-to-text input + text-to-speech replies | Users speak; the model transcribes, responds, and reads the answer back aloud. |
| `ai-wingman add image-gen` | Prompt-to-image route with display page | Generate images from a text prompt (DALL·E 3 by default). Includes a download button and swappable model flag. |
| `ai-wingman add generative-ui` | AI that streams back live React components | Instead of returning text, the model returns actual UI — charts, cards, forms — rendered in real time as they arrive. |
| `ai-wingman add document-processing` | Upload a file, extract structured data | Drop in a PDF; get back a typed object. Useful for invoice parsing, resume extraction, contract review. |

### Retrieval

Patterns for grounding the model in your own data.

| Command | What it builds | What that means |
|---------|---------------|-----------------|
| `ai-wingman add rag` | Embed → store → retrieve → answer pipeline | Let the AI answer questions about *your* documents. It converts text to vectors, finds the most relevant chunks at query time, and uses them as context. This is how "chat with your PDF" products work. |
| `ai-wingman add hybrid-search` | Keyword + semantic search, merged | Runs a BM25 keyword search and a vector similarity search in parallel, then blends the rankings. More accurate than either approach alone — a drop-in upgrade to `rag`. |
| `ai-wingman add memory` | Per-user long-term memory across sessions | Saves facts about each user as embeddings, retrieves the most relevant ones at the start of each conversation, and injects them into the system prompt automatically. |

### Agents

Patterns where the model takes multiple steps or hands off to humans or other models.

| Command | What it builds | What that means |
|---------|---------------|-----------------|
| `ai-wingman add agent` | Autonomous multi-step agent loop | The model thinks, calls a tool, sees the result, thinks again — repeating until the task is done. You set the step limit and define the tools. |
| `ai-wingman add interrupt` | Agent with human-in-the-loop approval gates | Like the agent pattern, but the model pauses and asks a human to confirm before taking any action that can't be undone. |
| `ai-wingman add multi-agent` | Orchestrator that delegates to specialist sub-agents | A coordinator model breaks work into sub-tasks and hands each off to a focused specialist. Results are synthesized into a single response. |
| `ai-wingman add background-agent` | Agent that runs outside the HTTP request cycle | Enqueue a task, get a job ID back immediately, then poll for status and result. For work that takes too long to complete in a single HTTP request. |

### Quality & Safety

Patterns that judge, classify, or score AI inputs and outputs.

| Command | What it builds | What that means |
|---------|---------------|-----------------|
| `ai-wingman add eval` | LLM-as-judge evaluation harness | A test suite for AI outputs. You write test cases; a judge model scores each answer. Catch regressions when you change prompts or swap models — the same way unit tests catch bugs in regular code. |
| `ai-wingman add content-moderation` | LLM-based content classifier | Classifies any input or output against a policy you define. Returns `{ allowed, category, reason }` — drop it in front of any route. |

---

## New to AI development?

These terms come up constantly. Here's what they actually mean:

**Streaming** — the model generates one token (roughly one word) at a time. Streaming means sending each token to the browser as it arrives, so the UI updates live. Without streaming, you wait for the full response before showing anything.

**Structured output** — by default, models return plain text. Structured output forces the model to return a JSON object that matches a schema you define — so you get typed fields instead of a paragraph you'd have to parse.

**Tool calling** — you define functions in your code and tell the model they exist. The model decides when to call them and what arguments to pass. Your code runs the function and returns the result. The model incorporates that result and keeps going. This is the foundation of all agent behavior.

**RAG** — Retrieval-Augmented Generation. Your documents are converted to vectors (lists of numbers that capture meaning), stored in a vector database, and searched at query time. The most relevant chunks are included in the prompt alongside the user's question. The model answers using your data, not just what it learned during training.

**Eval** — AI outputs are non-deterministic. An eval harness measures quality by running your prompts against test cases and scoring the outputs — usually with a second model acting as a judge. It's how you tell whether a prompt change made things better or worse.

---

## Quick start

```bash
npx ai-wingman add chat
```

Add `--yes` to accept all defaults non-interactively:

### AI coding assistant integration

If you use Claude Code, Cursor, or another AI coding assistant, run:

```bash
npx ai-wingman skill
```

This downloads a `SKILL.md` into your project that tells your assistant about ai-wingman — what patterns are available, when to use them, and how to invoke them. Once it's there, your assistant will automatically reach for `ai-wingman add` instead of writing AI boilerplate by hand.

```bash
npx ai-wingman skill                        # saves to ./SKILL.md (default)
npx ai-wingman skill --output .cursorrules  # custom output path
```

```bash
npx ai-wingman add chat --provider anthropic --yes
npx ai-wingman add rag --provider openai --storage pgvector --yes
npx ai-wingman add chat --provider anthropic --overwrite --yes  # re-scaffold
```

### Providers

| Value | Package installed | Env var required |
|-------|------------------|-----------------|
| `anthropic` | `@ai-sdk/anthropic` | `ANTHROPIC_API_KEY` |
| `openai` | `@ai-sdk/openai` | `OPENAI_API_KEY` |
| `google` | `@ai-sdk/google` | `GOOGLE_GENERATIVE_AI_API_KEY` |

### All flags

| Flag | Applies to | What it does |
|------|-----------|-------------|
| `--provider <id>` | all | `anthropic` / `openai` / `google` |
| `--auth` | all | Add a NextAuth v5 session check to the route |
| `--no-page` | patterns with pages | Skip generating the page component |
| `--storage <id>` | `rag` | `memory` / `sqlite` / `pgvector` |
| `--storage memory` | `chat` | Add in-memory conversation storage |
| `--interrupt` | `chat` | Add a human approval gate to the chat route |
| `--stream` | `rag` | Stream the answer instead of waiting for the full response |
| `--schema-name <name>` | `structured-output`, `stream-object` | Name for the generated schema, type, and hook |
| `--no-hook` | `structured-output`, `stream-object` | Skip the generated React hook |
| `--tool-name <name>` | `tools` | Name for the generated tool stub |
| `--image-model <model>` | `image-gen` | `dall-e-3` (default) or `dall-e-2` |
| `--api-route <path>` | all | Custom output path for the API route |
| `--overwrite` | all | Overwrite existing files without prompting |
| `-y, --yes` | all | Accept all defaults |

The CLI never silently overwrites a file — it prompts for each conflict unless `--overwrite` is set.

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Next.js + TypeScript | Required. The CLI exits if either is missing. |
| shadcn/ui | Required for page components. The CLI offers to set it up if it's not found. |

---

## Under the hood

- **Generators are pure functions** — `(config) => string`. No side effects, no network calls, no filesystem reads. Fast to test, easy to snapshot.
- **The planner runs before any files are written** — every `ai-wingman add` builds a complete `ExecutionPlan` first, shows it to you for confirmation, then executes. Nothing is written speculatively.
- **525 snapshot tests** across all 18 generators. Changing a generator output requires updating the snapshot deliberately — not by accident.
- **Providers and patterns are registry entries** — adding a new provider is one object in `providers.ts`. All generators pick it up automatically.

For project structure, local dev setup, and contribution guidelines see [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to get started.

---

## License

MIT
