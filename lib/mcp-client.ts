import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

export async function createMCPClient(serverUrl: string) {
  const client = new Client(
    { name: 'netguard-chat', version: '1.0.0' },
    { capabilities: { tools: {} } }
  )
  const transport = new StreamableHTTPClientTransport(new URL(serverUrl))
  await client.connect(transport)
  return client
}
