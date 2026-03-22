import { NextRequest, NextResponse } from 'next/server'
import { getMCPClient, resetMCPClient } from '@/lib/mcp-client'
import { getAppConfig } from '@/lib/config'

export async function POST(req: NextRequest) {
  let url: string
  try {
    const body = await req.json()
    url = body.url?.trim() || getAppConfig().mcpServerUrl
  } catch {
    url = getAppConfig().mcpServerUrl
  }

  try {
    new URL(url)
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid URL format' }, { status: 400 })
  }

  const start = Date.now()
  try {
    const client = await getMCPClient(url)
    let tools
    try {
      const result = await client.listTools()
      tools = result.tools
    } catch {
      // Stale connection (e.g. MCP server restarted) — reset and retry once
      await resetMCPClient()
      const fresh = await getMCPClient(url)
      const result = await fresh.listTools()
      tools = result.tools
    }

    return NextResponse.json({
      ok: true,
      toolCount: tools.length,
      tools: tools.map(t => t.name),
      latencyMs: Date.now() - start,
      url,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const friendly = message.includes('ECONNREFUSED')
      ? 'Connection refused — is the MCP server running?'
      : message.includes('ENOTFOUND') || message.includes('getaddrinfo')
      ? 'Host not found — check the URL'
      : message.includes('Missing sessionId')
      ? 'Wrong endpoint — use the /sse path, not /message'
      : message.includes('Cannot POST')
      ? 'Wrong endpoint — the MCP server SSE path is /sse'
      : message
    return NextResponse.json({ ok: false, error: friendly, latencyMs: Date.now() - start, url }, { status: 502 })
  }
  // Do NOT close the client — it's a shared singleton kept alive for reuse
}
