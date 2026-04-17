'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

const RESOURCE_URI = 'ui://product-wishlist'

export default function Home() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const [input, setInput] = useState('')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const appBridgeRef = useRef<import('@modelcontextprotocol/ext-apps/app-bridge').AppBridge | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const loading = status === 'streaming' || status === 'submitted'

  // Find the first product_wishlist_browse tool part across all messages
  const browseToolPart = useMemo(() => {
    for (const msg of messages) {
      if (msg.role !== 'assistant') continue
      for (const part of msg.parts ?? []) {
        if (part.type === 'dynamic-tool' && (part as { type: string; toolName: string }).toolName === 'product_wishlist_browse') {
          return part as { type: string; toolName: string; state: string; input?: unknown }
        }
      }
    }
    return null
  }, [messages])

  const showPanel = browseToolPart !== null

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Initialize AppBridge when the browse tool is called
  useEffect(() => {
    if (!showPanel || !iframeRef.current) return
    if (appBridgeRef.current) return

    // Set to a truthy sentinel immediately (synchronously) so a second effect run
    // in React Strict Mode sees the guard and returns before the async work duplicates.
    appBridgeRef.current = {} as never

    const iframe = iframeRef.current

    async function setupAppBridge() {
      const { AppBridge, PostMessageTransport } = await import('@modelcontextprotocol/ext-apps/app-bridge')
      const { Client } = await import('@modelcontextprotocol/sdk/client/index.js')
      const { StreamableHTTPClientTransport } = await import('@modelcontextprotocol/sdk/client/streamableHttp.js')

      const mcpClient = new Client({ name: 'ProductWishlistHost', version: '1.0.0' })
      await mcpClient.connect(
        new StreamableHTTPClientTransport(new URL('/api/mcp', window.location.origin))
      )

      const serverCaps = mcpClient.getServerCapabilities()

      const bridge = new AppBridge(mcpClient, { name: 'ProductWishlistHost', version: '1.0.0' }, {
        openLinks: {},
        serverTools: serverCaps?.tools,
        serverResources: serverCaps?.resources,
      })

      appBridgeRef.current = bridge

      bridge.oninitialized = () => {
        bridge.sendToolInput({ arguments: (browseToolPart?.input as Record<string, unknown>) ?? {} })
      }

      // Connect AppBridge BEFORE writing HTML so it's listening when the App connects
      const connectPromise = bridge.connect(
        new PostMessageTransport(iframe.contentWindow!, iframe.contentWindow!)
      )

      const resource = await mcpClient.readResource({ uri: RESOURCE_URI })
      const html = (resource.contents[0] as { text: string }).text
      const doc = iframe.contentDocument!
      doc.open()
      doc.write(html)
      doc.close()

      await connectPromise
    }

    setupAppBridge().catch(console.error)
  }, [showPanel, browseToolPart])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    sendMessage({ text })
  }

  type DisplayMessage = { role: 'user' | 'assistant'; content: string }

  const displayMessages = useMemo<DisplayMessage[]>(() => {
    const result: DisplayMessage[] = []
    for (const msg of messages) {
      if (msg.role !== 'user' && msg.role !== 'assistant') continue
      const text = msg.parts
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map(p => p.text)
        .join('\n')
      if (text) result.push({ role: msg.role, content: text })
    }
    return result
  }, [messages])

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a0f' }}>

      {/* Chat panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: showPanel ? 480 : 680,
        margin: '0 auto',
        padding: '24px 16px 0',
      }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#e4e4f0' }}>Product Wishlist</h1>
          <p style={{ fontSize: 12, color: '#6b6b8a', marginTop: 2 }}>
            Ask about products, add to wishlist or cart, or say &ldquo;show me the catalog&rdquo;
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }}>
          {displayMessages.length === 0 && (
            <div style={{ color: '#3f3f46', fontSize: 13, paddingTop: 8 }}>
              Try: &ldquo;Show me the products&rdquo;
            </div>
          )}
          {displayMessages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: msg.role === 'user' ? '#1e1e2c' : '#161620',
                border: `1px solid ${msg.role === 'user' ? '#2e2e3e' : '#1e1e28'}`,
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '10px 14px',
                fontSize: 13,
                color: '#e4e4f0',
                lineHeight: 1.55,
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div style={{
              alignSelf: 'flex-start',
              background: '#161620',
              border: '1px solid #1e1e28',
              borderRadius: '16px 16px 16px 4px',
              padding: '10px 14px',
              display: 'flex',
              gap: 5,
              alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#6b6b8a' }} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 0 20px',
            borderTop: '1px solid #1a1a22',
          }}
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Message…"
            disabled={loading}
            style={{
              flex: 1,
              background: '#161620',
              border: '1px solid #1e1e28',
              borderRadius: 10,
              padding: '9px 14px',
              fontSize: 13,
              color: '#e4e4f0',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? '#1a1a22' : '#4c6ef5',
              color: loading || !input.trim() ? '#3f3f46' : '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            Send
          </button>
        </form>
      </div>

      {/* MCP App iframe panel — shown when browse tool is called */}
      {showPanel && (
        <div style={{
          width: 360,
          background: '#0d0d14',
          borderLeft: '1px solid #1a1a22',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #1a1a22' }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: '#6b6b8a', textTransform: 'uppercase' }}>
              MCP App
            </span>
          </div>
          {/* Empty iframe — HTML is injected via AppBridge after MCP handshake */}
          <iframe
            ref={iframeRef}
            style={{ flex: 1, border: 'none', background: '#0d0d14' }}
            sandbox="allow-scripts allow-same-origin"
            title="Product Catalog MCP App"
          />
        </div>
      )}

    </div>
  )
}
