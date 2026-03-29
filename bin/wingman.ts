import { Command } from 'commander'
import { addCommand } from '../src/commands/add/index.js'
import { listCommand } from '../src/commands/list/index.js'
import { skillCommand } from '../src/commands/skill/index.js'

const program = new Command()
  .name('wingman')
  .description('Add AI patterns to your existing app')
  .version('0.1.0')

program
  .command('add')
  .description('Add an AI pattern to your app')
  .argument('<pattern>', 'Pattern name to scaffold (e.g. chat)')
  .option('--provider <id>', 'AI provider: anthropic | openai | google')
  .option('--storage <id>', 'Storage backend: memory | postgres')
  .option('--auth', 'Include auth (NextAuth v5)')
  .option('--interrupt', 'Include human-in-the-loop interrupt approval (chat pattern only)')
  .option('--no-page', 'Exclude page component')
  .option('--no-chat-ui', 'Exclude Chat UI')
  .option('--api-route <path>', 'Output path for API route')
  .option('--storage-path <path>', 'Output path for storage adapter')
  .option('--page-path <path>', 'Output path for page component')
  .option('--overwrite', 'Overwrite existing files without prompting')
  .option('-y, --yes', 'Accept all defaults, skip optional prompts')
  // structured-output flags
  .option('--schema-name <name>', 'Schema/hook/type name (default: output)')
  .option('--schema-path <path>', 'Output path for schema file')
  .option('--hook-path <path>', 'Output path for client hook')
  .option('--no-hook', 'Exclude client hook')
  // rag + hybrid-search flags
  .option('--embedding-model <model>', 'Embedding model ID (rag, hybrid-search)')
  // image-gen flags
  .option('--image-model <model>', 'Image model: dall-e-3 | dall-e-2 (default: dall-e-3)')
  // generative-ui flags
  .option('--route-path <path>', 'Output path for API route (generative-ui)')
  // document-processing flags (reuses --schema-name, --schema-path, --hook-path, --no-hook from structured-output)
  .action(addCommand)

program
  .command('list')
  .description('List all available patterns')
  .action(listCommand)

program
  .command('skill')
  .description('Download the ai-wingman skill file for your AI coding assistant')
  .option('-o, --output <path>', 'Output path (default: ./SKILL.md)')
  .action(skillCommand)

program.parse()
