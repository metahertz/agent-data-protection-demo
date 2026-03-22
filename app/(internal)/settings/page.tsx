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
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Info,
  Eye,
  EyeOff,
  Bug,
} from 'lucide-react'

interface AppSettings {
  mcpServerUrl: string
  systemPromptMode: 'unsafe' | 'safe'
  debugMode: boolean
  hasMongoDB: boolean
  hasAnthropicKey: boolean
}

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
              onChange={e => setMcpUrl(e.target.value)}
              placeholder="http://localhost:3100"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => saveField('mcp', { mcpServerUrl: mcpUrl })}
                disabled={saving === 'mcp' || !mcpUrl}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white disabled:text-slate-500 text-sm rounded-lg transition-colors"
              >
                {saving === 'mcp' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save MCP URL
              </button>
              <SaveFeedback field="mcp" />
            </div>
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
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings?.debugMode ? 'bg-amber-500' : 'bg-slate-600'
                } ${saving === 'debug' ? 'opacity-50' : ''}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings?.debugMode ? 'translate-x-6' : 'translate-x-0.5'
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
