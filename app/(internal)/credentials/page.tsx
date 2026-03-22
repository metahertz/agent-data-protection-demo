'use client'

import { useState, useEffect } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Eye, EyeOff, AlertTriangle, Key, RefreshCw } from 'lucide-react'

interface Credential {
  _id: string
  hostname: string
  username: string
  password: string
  enable_password: string
  snmp_community: string
  ssh_key_fingerprint: string
}

function RevealField({ value, label }: { value: string; label?: string }) {
  const [revealed, setRevealed] = useState(false)

  if (!value) {
    return <span className="text-slate-600 text-xs italic">—</span>
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono text-xs ${revealed ? 'text-amber-300' : 'text-slate-500'}`}>
        {revealed ? value : '••••••••••••'}
      </span>
      <button
        onClick={() => setRevealed(!revealed)}
        className="text-slate-500 hover:text-slate-300 transition-colors"
        title={revealed ? 'Hide' : 'Reveal'}
      >
        {revealed ? (
          <EyeOff className="w-3.5 h-3.5" />
        ) : (
          <Eye className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  )
}

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCredentials = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/credentials')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCredentials(data.credentials || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load credentials')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCredentials()
  }, [])

  return (
    <PageWrapper title="Credentials">
      {/* Warning Banner */}
      <div className="mb-6 flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-300 text-sm font-semibold">Security Warning — Educational Demo Only</p>
          <p className="text-red-400/80 text-xs mt-1">
            This page displays sensitive credentials including plaintext passwords. In a production environment,
            credentials must NEVER be stored in plaintext or exposed through a web interface.
            Use a PAM system (CyberArk, HashiCorp Vault, etc.) to manage network device credentials.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            Device Credentials ({credentials.length})
          </h2>
          <button
            onClick={fetchCredentials}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-slate-600 animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Loading credentials...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-slate-500 text-xs mt-2">Ensure MongoDB is connected and data is seeded.</p>
          </div>
        ) : credentials.length === 0 ? (
          <div className="p-12 text-center">
            <Key className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No credentials found. Load sample data from Settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/30">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Hostname</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Username</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Password</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Enable Password</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">SNMP Community</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">SSH Fingerprint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {credentials.map((cred) => (
                  <tr key={cred._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-200 text-xs font-medium whitespace-nowrap">
                      {cred.hostname}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300 text-xs whitespace-nowrap">
                      {cred.username}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <RevealField value={cred.password} label="password" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <RevealField value={cred.enable_password} label="enable password" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <RevealField value={cred.snmp_community} label="SNMP community" />
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500 text-xs whitespace-nowrap max-w-[200px] truncate">
                      {cred.ssh_key_fingerprint || <span className="text-slate-700 italic">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
