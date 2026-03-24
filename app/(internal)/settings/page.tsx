'use client'

import { useState, useEffect } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import {
  Settings,
  Database,
  Key,
  Server,
  ShieldAlert,
  Shield,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Info,
  Eye,
  EyeOff,
  Bug,
  Plug,
  Zap,
  XCircle,
  Bot,
  Lock,
} from 'lucide-react'

interface AppSettings {
  mcpServerUrl: string
  systemPromptMode: 'unsafe' | 'safe'
  debugMode: boolean
  modelId: string
  viewProtectionEnabled: boolean
  hasMongoDB: boolean
  hasAnthropicKey: boolean
}

const MODEL_OPTIONS = [
  {
    id: 'claude-sonnet-4-6',
    label: 'Claude Sonnet 4.6',
    desc: 'Default — highly resistant to jailbreaks',
    badge: 'Most Secure',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    id: 'claude-haiku-4-5',
    label: 'Claude Haiku 4.5',
    desc: 'Smaller, faster — moderately more susceptible',
    badge: 'Faster',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 'claude-3-haiku-20240307',
    label: 'Claude 3 Haiku (legacy)',
    desc: 'Older model — most susceptible to prompt injection',
    badge: 'Legacy',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
]

interface SeedResult {
  devices: number
  credentials: number
  configBackups: number
  logs: number
  telemetry: number
}

function SecretInput({
  value, onChange, placeholder, disabled
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  disabled?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full pr-10 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

function SectionCard({ title, icon, children }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700/50">
      <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [mongoUri, setMongoUri] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [mcpUrl, setMcpUrl] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [saveResult, setSaveResult] = useState<Record<string, { ok: boolean; msg: string }>>({})
  const [restartRequired, setRestartRequired] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null)
  const [seedError, setSeedError] = useState<string | null>(null)
  const [mcpTesting, setMcpTesting] = useState(false)
  const [mcpTestResult, setMcpTestResult] = useState<{
    ok: boolean
    toolCount?: number
    tools?: string[]
    latencyMs?: number
    error?: string
  } | null>(null)
  const [viewWorking, setViewWorking] = useState(false)
  const [viewStatus, setViewStatus] = useState<{ ok: boolean; msg: string } | null>(null)

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        setMcpUrl(data.mcpServerUrl || '')
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const saveField = async (field: string, body: Record<string, string>) => {
    setSaving(field)
    setSaveResult(prev => ({ ...prev, [field]: { ok: false, msg: '' } }))
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.restartRequired) setRestartRequired(true)
        setSaveResult(prev => ({ ...prev, [field]: { ok: true, msg: 'Saved!' } }))
        loadSettings()
      } else {
        setSaveResult(prev => ({ ...prev, [field]: { ok: false, msg: data.error || 'Failed' } }))
      }
    } catch {
      setSaveResult(prev => ({ ...prev, [field]: { ok: false, msg: 'Network error' } }))
    } finally {
      setSaving(null)
      setTimeout(() => setSaveResult(prev => ({ ...prev, [field]: { ok: false, msg: '' } })), 3000)
    }
  }

  const saveModelId = async (id: string) => {
    setSaving('model')
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: id }),
      })
      if (res.ok) {
        setSettings(prev => prev ? { ...prev, modelId: id } : prev)
        setSaveResult(prev => ({ ...prev, model: { ok: true, msg: 'Model updated!' } }))
        setTimeout(() => setSaveResult(prev => ({ ...prev, model: { ok: false, msg: '' } })), 3000)
      }
    } catch { /* ignore */ }
    finally { setSaving(null) }
  }

  const toggleViewProtection = async (enabled: boolean) => {
    setSaving('viewProtection')
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewProtectionEnabled: enabled }),
      })
      if (res.ok) {
        setSettings(prev => prev ? { ...prev, viewProtectionEnabled: enabled } : prev)
      }
    } catch { /* ignore */ }
    finally { setSaving(null) }
  }

  const manageView = async (action: 'create' | 'drop') => {
    setViewWorking(true)
    setViewStatus(null)
    try {
      const res = await fetch('/api/mongodb-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      setViewStatus({ ok: data.ok, msg: data.message || data.error || (data.ok ? 'Done' : 'Failed') })
      if (data.ok) loadSettings()
    } catch (e) {
      setViewStatus({ ok: false, msg: e instanceof Error ? e.message : 'Request failed' })
    } finally {
      setViewWorking(false)
    }
  }

  const savePromptMode = async (mode: 'unsafe' | 'safe') => {
    setSaving('promptMode')
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPromptMode: mode }),
      })
      if (res.ok) {
        setSettings(prev => prev ? { ...prev, systemPromptMode: mode } : prev)
        setSaveResult(prev => ({ ...prev, promptMode: { ok: true, msg: 'Mode updated!' } }))
        setTimeout(() => setSaveResult(prev => ({ ...prev, promptMode: { ok: false, msg: '' } })), 3000)
      }
    } catch { /* ignore */ }
    finally { setSaving(null) }
  }

  const runSeed = async () => {
    setSeeding(true)
    setSeedResult(null)
    setSeedError(null)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        setSeedResult(data.counts)
        loadSettings()
      } else {
        setSeedError(data.error || 'Seed failed')
      }
    } catch (e) {
      setSeedError(e instanceof Error ? e.message : 'Seed failed')
    } finally {
      setSeeding(false)
    }
  }

  const SaveFeedback = ({ field }: { field: string }) => {
    const result = saveResult[field]
    if (!result?.msg) return null
    return (
      <span className={`text-xs flex items-center gap-1 ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>
        {result.ok ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
        {result.msg}
      </span>
    )
  }

  return (
    <PageWrapper title="Settings">
      <div className="max-w-2xl space-y-6">
        {/* Restart notice */}
        {restartRequired && (
          <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 text-sm font-semibold">Server restart required</p>
              <p className="text-amber-400/80 text-xs mt-1">
                Environment variable changes (MongoDB URI, Anthropic API Key) take effect after restarting the Next.js dev server.
                Run <code className="bg-amber-900/30 px-1 rounded">npm run dev</code> again to apply changes.
              </p>
            </div>
          </div>
        )}

        {/* MongoDB */}
        <SectionCard
          title="MongoDB Connection"
          icon={<Database className="w-4 h-4 text-emerald-400" />}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs">
              {settings?.hasMongoDB ? (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" /> Not configured
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs">
              Paste your MongoDB connection string. It will be saved to .env.local and requires a restart.
            </p>
            <SecretInput
              value={mongoUri}
              onChange={setMongoUri}
              placeholder="mongodb+srv://user:pass@cluster.mongodb.net/network-mgmt"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => saveField('mongo', { mongodbUri: mongoUri })}
                disabled={saving === 'mongo' || !mongoUri}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white disabled:text-slate-500 text-sm rounded-lg transition-colors"
              >
                {saving === 'mongo' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save MongoDB URI
              </button>
              <SaveFeedback field="mongo" />
            </div>
          </div>
        </SectionCard>

        {/* Anthropic API Key */}
        <SectionCard
          title="Anthropic API Key"
          icon={<Key className="w-4 h-4 text-purple-400" />}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs">
              {settings?.hasAnthropicKey ? (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" /> Configured
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" /> Not configured
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs">
              Required for the AI chat feature. Get your key from{' '}
              <a href="https://console.anthropic.com" target="_blank" rel="noopener" className="text-purple-400 hover:underline">
                console.anthropic.com
              </a>
            </p>
            <SecretInput
              value={anthropicKey}
              onChange={setAnthropicKey}
              placeholder="sk-ant-api03-..."
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => saveField('anthropic', { anthropicApiKey: anthropicKey })}
                disabled={saving === 'anthropic' || !anthropicKey}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white disabled:text-slate-500 text-sm rounded-lg transition-colors"
              >
                {saving === 'anthropic' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save API Key
              </button>
              <SaveFeedback field="anthropic" />
            </div>
          </div>
        </SectionCard>

        {/* MCP Server URL */}
        <SectionCard
          title="MCP Server URL"
          icon={<Server className="w-4 h-4 text-blue-400" />}
        >
          <div className="space-y-3">
            <p className="text-slate-500 text-xs flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-400" />
              The MCP server provides database tools to the AI. Changes take effect immediately without restart.
            </p>
            <input
              type="text"
              value={mcpUrl}
              onChange={e => { setMcpUrl(e.target.value); setMcpTestResult(null) }}
              placeholder="http://localhost:3100/mcp"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => saveField('mcp', { mcpServerUrl: mcpUrl })}
                disabled={saving === 'mcp' || !mcpUrl}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white disabled:text-slate-500 text-sm rounded-lg transition-colors"
              >
                {saving === 'mcp' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save MCP URL
              </button>
              <button
                onClick={async () => {
                  setMcpTesting(true)
                  setMcpTestResult(null)
                  try {
                    const res = await fetch('/api/mcp-test', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ url: mcpUrl }),
                    })
                    const data = await res.json()
                    setMcpTestResult(data)
                  } catch (e) {
                    setMcpTestResult({ ok: false, error: e instanceof Error ? e.message : 'Request failed' })
                  } finally {
                    setMcpTesting(false)
                  }
                }}
                disabled={mcpTesting || !mcpUrl}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-slate-200 disabled:text-slate-500 text-sm rounded-lg transition-colors border border-slate-600"
              >
                {mcpTesting
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Plug className="w-3.5 h-3.5" />}
                Test Connection
              </button>
              <SaveFeedback field="mcp" />
            </div>

            {/* MCP test result */}
            {mcpTestResult && (
              <div className={`rounded-lg border p-3 text-sm ${
                mcpTestResult.ok
                  ? 'bg-emerald-500/10 border-emerald-500/25'
                  : 'bg-red-500/10 border-red-500/25'
              }`}>
                {mcpTestResult.ok ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-medium">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      Connected successfully
                      {mcpTestResult.latencyMs !== undefined && (
                        <span className="ml-auto text-xs text-slate-400 font-normal flex items-center gap-1">
                          <Zap className="w-3 h-3" />{mcpTestResult.latencyMs} ms
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs">
                      {mcpTestResult.toolCount} tool{mcpTestResult.toolCount !== 1 ? 's' : ''} available
                    </p>
                    {mcpTestResult.tools && mcpTestResult.tools.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {mcpTestResult.tools.map(t => (
                          <span key={t} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs font-mono text-emerald-300">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-red-400 font-medium">
                      <XCircle className="w-4 h-4 flex-shrink-0" />
                      Connection failed
                      {mcpTestResult.latencyMs !== undefined && (
                        <span className="ml-auto text-xs text-slate-400 font-normal flex items-center gap-1">
                          <Zap className="w-3 h-3" />{mcpTestResult.latencyMs} ms
                        </span>
                      )}
                    </div>
                    <p className="text-red-300/80 text-xs">{mcpTestResult.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </SectionCard>

        {/* System Prompt Mode */}
        <SectionCard
          title="System Prompt Mode"
          icon={<Settings className="w-4 h-4 text-slate-400" />}
        >
          <div className="space-y-4">
            <p className="text-slate-500 text-xs">
              Controls how the AI assistant handles sensitive data. Changes take effect on the next chat message.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Unsafe */}
              <button
                onClick={() => savePromptMode('unsafe')}
                className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                  settings?.systemPromptMode === 'unsafe'
                    ? 'border-red-500/60 bg-red-500/5'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                }`}
              >
                {settings?.systemPromptMode === 'unsafe' && (
                  <span className="absolute top-2 right-2 text-xs text-red-400 flex items-center gap-0.5">
                    <CheckCircle className="w-3 h-3" /> Active
                  </span>
                )}
                <ShieldAlert className="w-6 h-6 text-red-400 mb-2" />
                <p className="text-white text-sm font-semibold">Unsafe</p>
                <p className="text-slate-400 text-xs mt-1">
                  AI will retrieve and display credentials from the database verbatim.
                  Demonstrates the security vulnerability.
                </p>
              </button>

              {/* Safe */}
              <button
                onClick={() => savePromptMode('safe')}
                className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                  settings?.systemPromptMode === 'safe'
                    ? 'border-emerald-500/60 bg-emerald-500/5'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                }`}
              >
                {settings?.systemPromptMode === 'safe' && (
                  <span className="absolute top-2 right-2 text-xs text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle className="w-3 h-3" /> Active
                  </span>
                )}
                <Shield className="w-6 h-6 text-emerald-400 mb-2" />
                <p className="text-white text-sm font-semibold">Safe</p>
                <p className="text-slate-400 text-xs mt-1">
                  AI will refuse credential requests and direct users to the PAM system.
                  Demonstrates best practice.
                </p>
              </button>
            </div>
            {saving === 'promptMode' && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </p>
            )}
            {saveResult.promptMode?.msg && (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3" /> {saveResult.promptMode.msg}
              </p>
            )}
          </div>
        </SectionCard>

        {/* AI Model */}
        <SectionCard
          title="AI Model"
          icon={<Bot className="w-4 h-4 text-purple-400" />}
        >
          <div className="space-y-3">
            <p className="text-slate-500 text-xs">
              Selects which Claude model powers the chat. Modern models are highly resistant to prompt injection.
              Use a legacy model to demonstrate Part 2 of the educational demo.
            </p>
            <div className="space-y-2">
              {MODEL_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => saveModelId(opt.id)}
                  disabled={saving === 'model'}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    settings?.modelId === opt.id
                      ? 'border-purple-500/60 bg-purple-500/5'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{opt.label}</span>
                      <span className={`px-1.5 py-0.5 text-xs rounded border ${opt.badgeColor}`}>{opt.badge}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                  {settings?.modelId === opt.id && (
                    <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
            {saving === 'model' && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </p>
            )}
            {saveResult.model?.msg && (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3" /> {saveResult.model.msg}
              </p>
            )}
          </div>
        </SectionCard>

        {/* Part 3: Database View Protection */}
        <SectionCard
          title="Part 3: Database View Protection"
          icon={<Lock className="w-4 h-4 text-emerald-400" />}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-2 px-3 py-2 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-blue-300/80 text-xs">
                Creates a MongoDB view <code className="bg-blue-900/30 px-1 rounded">credentials_safe</code> that
                omits <code className="bg-blue-900/30 px-1 rounded">password</code>,{' '}
                <code className="bg-blue-900/30 px-1 rounded">enable_password</code>, and{' '}
                <code className="bg-blue-900/30 px-1 rounded">snmp_community</code> fields.
                When View Protection is enabled, all system prompts reference this view — even a
                fully jailbroken AI can only return data the view contains.
              </p>
            </div>

            {/* Step 1: Create/drop view */}
            <div>
              <p className="text-xs font-medium text-slate-300 mb-2">Step 1 — Create the restricted view</p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => manageView('create')}
                  disabled={viewWorking || !settings?.hasMongoDB}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 text-white disabled:text-slate-500 text-sm rounded-lg transition-colors"
                >
                  {viewWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  Create credentials_safe View
                </button>
                <button
                  onClick={() => manageView('drop')}
                  disabled={viewWorking || !settings?.hasMongoDB}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-slate-300 disabled:text-slate-500 text-sm rounded-lg transition-colors border border-slate-600"
                >
                  {viewWorking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Drop View
                </button>
              </div>
              {viewStatus && (
                <p className={`text-xs mt-2 flex items-center gap-1.5 ${viewStatus.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {viewStatus.ok ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {viewStatus.msg}
                </p>
              )}
              {!settings?.hasMongoDB && (
                <p className="text-xs text-amber-400 mt-2">MongoDB must be configured first.</p>
              )}
            </div>

            {/* Step 2: Enable view protection */}
            <div>
              <p className="text-xs font-medium text-slate-300 mb-2">Step 2 — Enable view protection</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">Use credentials_safe in all prompts</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {settings?.viewProtectionEnabled
                      ? 'Enabled — AI is directed to credentials_safe (no secrets in view)'
                      : 'Disabled — AI uses raw credentials collection'}
                  </p>
                </div>
                <button
                  onClick={() => toggleViewProtection(!settings?.viewProtectionEnabled)}
                  disabled={saving === 'viewProtection'}
                  className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${
                    settings?.viewProtectionEnabled ? 'bg-emerald-500' : 'bg-slate-600'
                  } ${saving === 'viewProtection' ? 'opacity-50' : ''}`}
                >
                  <span className={`absolute top-0.5 left-0 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings?.viewProtectionEnabled ? 'translate-x-[1.625rem]' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Debug Mode */}
        <SectionCard
          title="Debug Mode"
          icon={<Bug className="w-4 h-4 text-amber-400" />}
        >
          <div className="space-y-4">
            <p className="text-slate-500 text-xs">
              When enabled, the chat window displays internal status messages and MCP connection info as amber system bubbles.
              Useful for troubleshooting connectivity issues.
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">Show debug messages in chat</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {settings?.debugMode ? 'Enabled — status events visible in chat' : 'Disabled — clean chat view'}
                </p>
              </div>
              <button
                onClick={async () => {
                  const newVal = !settings?.debugMode
                  setSaving('debug')
                  try {
                    const res = await fetch('/api/settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ debugMode: newVal }),
                    })
                    if (res.ok) {
                      setSettings(prev => prev ? { ...prev, debugMode: newVal } : prev)
                    }
                  } catch { /* ignore */ }
                  finally { setSaving(null) }
                }}
                disabled={saving === 'debug'}
                className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors ${
                  settings?.debugMode ? 'bg-amber-500' : 'bg-slate-600'
                } ${saving === 'debug' ? 'opacity-50' : ''}`}
              >
                <span className={`absolute top-0.5 left-0 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings?.debugMode ? 'translate-x-[1.625rem]' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Load Sample Data */}
        <SectionCard
          title="Load Sample Data"
          icon={<Database className="w-4 h-4 text-emerald-400" />}
        >
          <div className="space-y-4">
            <p className="text-slate-500 text-xs">
              Populate MongoDB with sample network devices, credentials, configuration backups, logs, and telemetry.
              This will <strong className="text-amber-400">drop all existing data</strong> and insert fresh seed data.
            </p>

            {!settings?.hasMongoDB && (
              <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-400 text-xs">MongoDB is not configured. Add your connection string above first.</p>
              </div>
            )}

            <button
              onClick={runSeed}
              disabled={seeding || !settings?.hasMongoDB}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white disabled:text-slate-500 text-sm font-medium rounded-lg transition-colors w-full justify-center"
            >
              {seeding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Seeding database...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Load Sample Data
                </>
              )}
            </button>

            {seedResult && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-emerald-400 text-sm font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Database seeded successfully!
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(seedResult).map(([key, count]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-slate-400 capitalize">{key}:</span>
                      <span className="text-emerald-300 font-mono">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {seedError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 text-sm font-semibold mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Seed failed
                </p>
                <p className="text-red-400/80 text-xs">{seedError}</p>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </PageWrapper>
  )
}
