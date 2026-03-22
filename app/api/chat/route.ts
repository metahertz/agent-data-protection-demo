import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAppConfig } from '@/lib/config'
import { UNSAFE_SYSTEM_PROMPT } from '@/lib/chat-system-prompt'
import { SAFE_SYSTEM_PROMPT } from '@/lib/chat-system-prompt-safe'
import { getMCPClient, resetMCPClient } from '@/lib/mcp-client'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const { messages, mcpServerUrl: clientMcpUrl } = await req.json()

  const config = getAppConfig()
  const mcpServerUrl = clientMcpUrl || config.mcpServerUrl
  const systemPrompt = config.systemPromptMode === 'safe' ? SAFE_SYSTEM_PROMPT : UNSAFE_SYSTEM_PROMPT

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(
      `data: ${JSON.stringify({ type: 'error', message: 'ANTHROPIC_API_KEY not configured' })}\n\ndata: [DONE]\n\n`,
      { headers: { 'Content-Type': 'text/event-stream' } }
    )
  }

  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  const send = async (data: object) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
  }

  // Run agent loop in background
  ;(async () => {
    const client = new Anthropic({ apiKey })
    let mcpClient: Awaited<ReturnType<typeof getMCPClient>> | null = null

    try {
      // Connect to MCP server via shared singleton
      let tools: Anthropic.Messages.Tool[] = []
      try {
        mcpClient = await getMCPClient(mcpServerUrl)
        let toolsResult = await mcpClient.listTools().catch(async () => {
          // Stale connection (server restarted) — reset and reconnect once
          await resetMCPClient()
          mcpClient = await getMCPClient(mcpServerUrl)
          return mcpClient.listTools()
        })
        tools = toolsResult.tools.map(t => ({
          name: t.name,
          description: t.description || '',
          input_schema: (t.inputSchema as Anthropic.Messages.Tool['input_schema']) || { type: 'object', properties: {} }
        }))
        await send({ type: 'status', message: `Connected to MCP server. ${tools.length} tools available.` })
      } catch {
        await send({ type: 'status', message: 'MCP server unavailable — answering without database access.' })
      }

      // Agentic loop
      const conversationMessages: Anthropic.Messages.MessageParam[] = messages

      for (let iteration = 0; iteration < 10; iteration++) {
        const response = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: systemPrompt,
          tools: tools.length > 0 ? tools : undefined,
          messages: conversationMessages,
        })

        // Stream text content
        for (const block of response.content) {
          if (block.type === 'text') {
            await send({ type: 'text', delta: block.text })
          }
        }

        if (response.stop_reason === 'end_turn') break

        if (response.stop_reason === 'tool_use') {
          const toolUseBlocks = response.content.filter(
            (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use'
          )

          // Append assistant message
          conversationMessages.push({ role: 'assistant', content: response.content })

          // Execute tool calls
          const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []
          for (const toolUse of toolUseBlocks) {
            await send({ type: 'tool_call', name: toolUse.name, input: toolUse.input })

            let result = ''
            try {
              if (mcpClient) {
                const mcpResult = await mcpClient.callTool({ name: toolUse.name, arguments: toolUse.input as Record<string, unknown> })
                result = JSON.stringify(mcpResult.content)
              } else {
                result = 'MCP server unavailable'
              }
              let count = 1
              try {
                const parsed = JSON.parse(result)
                count = Array.isArray(parsed) ? parsed.length : 1
              } catch { /* ignore */ }
              await send({ type: 'tool_result', name: toolUse.name, count })
            } catch (e) {
              result = `Tool error: ${e instanceof Error ? e.message : 'Unknown error'}`
              await send({ type: 'tool_error', name: toolUse.name })
            }

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: result,
            })
          }

          conversationMessages.push({ role: 'user', content: toolResults })
        } else {
          break
        }
      }
    } catch (error) {
      await send({ type: 'error', message: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      // Do NOT close mcpClient — it's a shared singleton, kept alive for reuse
      await send({ type: 'done' })
      await writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
