import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'

// SSE transport (supergateway default) allows only ONE active connection to the
// underlying stdio process. We keep a global-level singleton so all requests
// share the same connection instead of creating one per request.
//
// IMPORTANT: Must use `global` (not module-level `let`) so the singleton
// survives Next.js hot module replacement (HMR) in development. Module-level
// variables are reset on every hot reload, but `global` persists for the
// lifetime of the Node process — matching the pattern used in lib/mongodb.ts.
declare global {
  // eslint-disable-next-line no-var
  var _mcpSingleton: { client: Client; url: string } | undefined
}

async function connect(serverUrl: string): Promise<Client> {
  const client = new Client(
    { name: 'netguard-chat', version: '1.0.0' },
    { capabilities: { tools: {} } }
  )
  await client.connect(new SSEClientTransport(new URL(serverUrl)))
  global._mcpSingleton = { client, url: serverUrl }
  return client
}

export async function getMCPClient(serverUrl: string): Promise<Client> {
  // URL changed — tear down the old connection and reconnect
  if (global._mcpSingleton && global._mcpSingleton.url !== serverUrl) {
    try { await global._mcpSingleton.client.close() } catch { /* ignore */ }
    global._mcpSingleton = undefined
  }
  if (!global._mcpSingleton) {
    return connect(serverUrl)
  }
  return global._mcpSingleton.client
}

// Called when a request detects the connection has gone stale (e.g. after a
// server restart). Clears the singleton so the next getMCPClient call reconnects.
export async function resetMCPClient(): Promise<void> {
  if (global._mcpSingleton) {
    try { await global._mcpSingleton.client.close() } catch { /* ignore */ }
    global._mcpSingleton = undefined
  }
}
