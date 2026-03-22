import { NextRequest, NextResponse } from 'next/server'
import { createMCPClient } from '@/lib/mcp-client'
import { getAppConfig } from '@/lib/config'

export async function POST(req: NextRequest) {
  let url: string
  try {
    const body = await req.json()
    url = body.url?.trim() || getAppConfig().mcpServerUrl
  } catch {
    url = getAppConfig().mcpServerUrl
  }

  let client
  try {
    new URL(url) // validate URL format before attempting connection
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid URL format' }, { status: 400 })
  }

  const start = Date.now()
  try {
    client = await createMCPClient(url)
    const { tools } = await client.listTools()
    const latencyMs = Date.now() - start
    return NextResponse.json({
      ok: true,
      toolCount: tools.length,
      tools: tools.map(t => t.name),
      latencyMs,
      url,
    })
  } catch (err) {
    const latencyMs = Date.now() - start
    const message = err instanceof Error ? err.message : String(err)
    // Simplify common error messages for the UI
    const friendly = message.includes('ECONNREFUSED')
      ? 'Connection refused — is the MCP server running?'
      : message.includes('ENOTFOUND') || message.includes('getaddrinfo')
      ? 'Host not found — check the URL'
      : message.includes('Missing sessionId')
      ? 'Wrong endpoint — use the /sse path, not /message'
      : message.includes('Cannot POST')
      ? 'Wrong endpoint — the MCP server SSE path is /sse'
      : message.includes('fetch') || message.includes('network')
      ? 'Network error — check URL and firewall'
      : message
    return NextResponse.json({ ok: false, error: friendly, latencyMs, url }, { status: 502 })
  } finally {
    try { await client?.close() } catch { /* ignore */ }
  }
}
