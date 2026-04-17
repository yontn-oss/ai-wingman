import { createOpenAI } from '@ai-sdk/openai'
import { createMCPClient } from '@ai-sdk/mcp'
import { streamText, convertToModelMessages, stepCountIs } from 'ai'

export const runtime = 'nodejs'

const openai = createOpenAI()

export async function POST(req: Request) {
  const { messages } = await req.json()

  const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
  const mcpClient = await createMCPClient({
    transport: { type: 'http', url: `${appUrl}/api/mcp` },
  })

  const tools = await mcpClient.tools()

  const result = streamText({
    model: openai('gpt-5.4-nano'),
    system: `You are a helpful shopping assistant for a product catalog.
You have tools to browse products, add items to the wishlist or cart, and view summaries.
When a user wants to browse or see products, call product_wishlist_browse — it will display an interactive panel with add buttons.
Keep responses concise. After tool calls, summarise what happened.`,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
    onFinish: async () => {
      await mcpClient.close()
    },
  })

  return result.toUIMessageStreamResponse()
}
