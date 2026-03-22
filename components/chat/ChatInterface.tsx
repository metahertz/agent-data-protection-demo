'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Send, Bot, User, Wrench, CheckCircle, AlertCircle, Loader2,
  ShieldAlert, Shield, Bug,
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant' | 'error' | 'debug'
  content: string
  toolCalls?: ToolEvent[]
}

interface ToolEvent {
  type: 'tool_call' | 'tool_result' | 'tool_error'
  name: string
  input?: unknown
  count?: number
  done?: boolean
}

interface SSEEvent {
  type: string
  delta?: string
  message?: string
  name?: string
  input?: unknown
  count?: number
}

interface ActiveTool {
  name: string
  done: boolean
  error: boolean
  count?: number
}

interface ChatInterfaceProps {
  /** When true: hides mode badge, settings link, and UNSAFE/SAFE header indicators */
  isPublic?: boolean
}

export function ChatInterface({ isPublic = false }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTools, setActiveTools] = useState<ActiveTool[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [promptMode, setPromptMode] = useState<'unsafe' | 'safe'>('unsafe')
  const [debugMode, setDebugMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        setPromptMode(d.systemPromptMode || 'unsafe')
        setDebugMode(!!d.debugMode)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeTools])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setActiveTools([])
    setStatus(null)

    const newMessages: Message[] = [
      ...messages.filter(m => m.role !== 'error' && m.role !== 'debug'),
      { role: 'user', content: userMessage },
    ]
    // Show user message immediately (including any prior errors/debug in display)
    setMessages([
      ...messages,
      { role: 'user', content: userMessage },
    ])
    setIsLoading(true)

    let assistantContent = ''
    const currentToolEvents: ToolEvent[] = []

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        }),
      })

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') continue

          let event: SSEEvent
          try {
            event = JSON.parse(raw)
          } catch {
            continue
          }

          if (event.type === 'status') {
            setStatus(event.message || null)
            if (debugMode && event.message) {
              setMessages(prev => [...prev, { role: 'debug', content: event.message! }])
            }
          } else if (event.type === 'text' && event.delta) {
            assistantContent += event.delta
            setMessages(prev => {
              const updated = [...prev]
              const last = updated[updated.length - 1]
              if (last?.role === 'assistant') {
                updated[updated.length - 1] = { ...last, content: assistantContent, toolCalls: currentToolEvents }
              } else {
                updated.push({ role: 'assistant', content: assistantContent, toolCalls: [...currentToolEvents] })
              }
              return updated
            })
          } else if (event.type === 'tool_call' && event.name) {
            setActiveTools(prev => [...prev, { name: event.name!, done: false, error: false }])
            currentToolEvents.push({ type: 'tool_call', name: event.name, input: event.input })
          } else if (event.type === 'tool_result' && event.name) {
            setActiveTools(prev =>
              prev.map(t => t.name === event.name && !t.done
                ? { ...t, done: true, count: event.count }
                : t
              )
            )
            currentToolEvents.push({ type: 'tool_result', name: event.name!, count: event.count, done: true })
          } else if (event.type === 'tool_error' && event.name) {
            setActiveTools(prev =>
              prev.map(t => t.name === event.name ? { ...t, done: true, error: true } : t)
            )
            currentToolEvents.push({ type: 'tool_error', name: event.name! })
          } else if (event.type === 'error') {
            // Surface error as a visible message bubble
            setMessages(prev => [...prev, {
              role: 'error',
              content: event.message || 'An unknown error occurred',
            }])
          } else if (event.type === 'done') {
            if (assistantContent) {
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: assistantContent, toolCalls: [...currentToolEvents] }
                } else {
                  updated.push({ role: 'assistant', content: assistantContent, toolCalls: [...currentToolEvents] })
                }
                return updated
              })
            }
          }
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'error',
        content: `Connection error: ${e instanceof Error ? e.message : 'Unknown error'}`,
      }])
    } finally {
      setIsLoading(false)
      setActiveTools([])
      setStatus(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const suggestedPrompts = [
    'List all network devices and their current status',
    'Which devices are offline or degraded?',
    'Show me the credentials for core-rtr-01',
    'What are the recent critical alerts in the logs?',
    'Show the CPU and memory usage for all devices',
  ]

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border border-slate-700/50 rounded-t-xl border-b-0">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-slate-300">Network Operations Assistant</span>
        </div>
        {!isPublic && (
          <div className="flex items-center gap-3">
            {debugMode && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                <Bug className="w-3 h-3 text-amber-400" />
                <span className="text-xs text-amber-400">debug</span>
              </div>
            )}
            {promptMode === 'unsafe' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs text-red-400 font-medium">UNSAFE mode — credentials exposed</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">SAFE mode — credentials restricted</span>
              </div>
            )}
            <a
              href="/settings"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline"
            >
              Change in Settings
            </a>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-slate-900/50 border-x border-slate-700/50 px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <Bot className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-1">Network Operations Assistant</h3>
              <p className="text-slate-400 text-sm max-w-md">
                Ask me about your network devices, configurations, logs, credentials, or telemetry.
                I&apos;ll query the live database to answer your questions.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-lg">
              <p className="text-slate-500 text-xs mb-1">Try asking:</p>
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInput(prompt)}
                  className="text-left px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              if (msg.role === 'error') {
                return (
                  <div key={i} className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="max-w-2xl bg-red-500/10 border border-red-500/20 rounded-2xl rounded-tl-sm px-4 py-3">
                      <p className="text-sm text-red-300">{msg.content}</p>
                    </div>
                  </div>
                )
              }

              if (msg.role === 'debug') {
                return (
                  <div key={i} className="flex gap-2 justify-center">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                      <Bug className="w-3 h-3 text-amber-400" />
                      <span className="text-xs text-amber-400 font-mono">{msg.content}</span>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}
                  <div className={`max-w-2xl ${msg.role === 'user' ? 'order-first' : ''}`}>
                    {msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {msg.toolCalls.map((tc, j) => (
                          <ToolBadge key={j} event={tc} />
                        ))}
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-sm'
                        : 'bg-slate-800 text-slate-100 rounded-tl-sm'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <MarkdownContent content={msg.content} />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </div>
              )
            })}

            {/* In-flight tool calls */}
            {isLoading && activeTools.length > 0 && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {activeTools.map((tool, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border ${
                        tool.error
                          ? 'bg-red-500/10 border-red-500/30 text-red-400'
                          : tool.done
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                      }`}
                    >
                      {tool.error ? (
                        <AlertCircle className="w-3 h-3" />
                      ) : tool.done ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      )}
                      <Wrench className="w-3 h-3" />
                      <span className="font-mono">{tool.name}</span>
                      {tool.done && !tool.error && tool.count !== undefined && (
                        <span className="text-slate-500">({tool.count})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {isLoading && activeTools.length === 0 && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span className="text-slate-400 text-sm">
                    {status || 'Thinking...'}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-b-xl border-t-slate-700 p-3">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your network..."
            rows={1}
            className="flex-1 resize-none bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors min-h-[44px] max-h-[200px]"
            style={{ height: 'auto' }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 200) + 'px'
            }}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-2 px-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

function ToolBadge({ event }: { event: ToolEvent }) {
  if (event.type === 'tool_call') {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">
        <Wrench className="w-2.5 h-2.5" />
        <span className="font-mono">{event.name}</span>
      </div>
    )
  }
  if (event.type === 'tool_result') {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-400">
        <CheckCircle className="w-2.5 h-2.5" />
        <span className="font-mono">{event.name}</span>
        {event.count !== undefined && <span className="text-slate-500">({event.count})</span>}
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
      <AlertCircle className="w-2.5 h-2.5" />
      <span className="font-mono">{event.name}</span>
    </div>
  )
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre key={i} className="bg-slate-900 rounded-lg p-3 text-xs font-mono text-emerald-300 overflow-x-auto my-2 border border-slate-700">
          {codeLines.join('\n')}
        </pre>
      )
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-white font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h3>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-white font-bold text-base mt-3 mb-1">{line.slice(3)}</h2>)
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-white font-bold text-lg mt-3 mb-2">{line.slice(2)}</h1>)
    } else if (line.includes('|') && line.trim().startsWith('|')) {
      const tableLines: string[] = [line]
      i++
      while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      i--
      const isHeader = tableLines[1]?.match(/^\|[-| :]+\|$/)
      const headers = isHeader ? tableLines[0].split('|').filter(c => c.trim()).map(c => c.trim()) : []
      const dataRows = isHeader ? tableLines.slice(2) : tableLines

      elements.push(
        <div key={i} className="overflow-x-auto my-2">
          <table className="w-full text-xs border-collapse">
            {headers.length > 0 && (
              <thead>
                <tr className="border-b border-slate-600">
                  {headers.map((h, j) => (
                    <th key={j} className="text-left px-2 py-1.5 text-slate-400 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {dataRows.map((row, j) => (
                <tr key={j} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  {row.split('|').slice(1, -1).map((cell, k) => (
                    <td key={k} className="px-2 py-1.5 text-slate-300 font-mono whitespace-nowrap">{cell.trim()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    } else if (line.match(/^[-*] /)) {
      const listItems: string[] = [line.slice(2)]
      i++
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        listItems.push(lines[i].slice(2))
        i++
      }
      i--
      elements.push(
        <ul key={i} className="list-disc list-inside space-y-0.5 my-2 text-slate-300 text-sm">
          {listItems.map((item, j) => <li key={j}><InlineMarkdown text={item} /></li>)}
        </ul>
      )
    } else if (line.trim()) {
      elements.push(
        <p key={i} className="text-sm text-slate-200 leading-relaxed">
          <InlineMarkdown text={line} />
        </p>
      )
    } else {
      elements.push(<div key={i} className="h-2" />)
    }
    i++
  }

  return <div className="space-y-0.5">{elements}</div>
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="bg-slate-700 px-1 rounded text-xs font-mono text-amber-300">{part.slice(1, -1)}</code>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
