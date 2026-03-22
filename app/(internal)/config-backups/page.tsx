'use client'

import { useState, useEffect } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { FileCode, RefreshCw, AlertTriangle, ChevronRight, Clock, Tag } from 'lucide-react'

interface ConfigBackup {
  _id: string
  hostname: string
  backup_time: string
  config_text: string
  size_bytes: number
  triggered_by: string
  version_label: string
}

interface HostnameGroup {
  hostname: string
  count: number
}

function TriggerBadge({ trigger }: { trigger: string }) {
  const styles: Record<string, string> = {
    scheduled: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    manual: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    'pre-change': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[trigger] || styles.scheduled}`}>
      {trigger}
    </span>
  )
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export default function ConfigBackupsPage() {
  const [backups, setBackups] = useState<ConfigBackup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedHostname, setSelectedHostname] = useState<string | null>(null)
  const [selectedBackup, setSelectedBackup] = useState<ConfigBackup | null>(null)

  const fetchBackups = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/config-backups?limit=100')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setBackups(data.backups || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load backups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBackups()
  }, [])

  // Group by hostname
  const hostnameGroups: HostnameGroup[] = Object.entries(
    backups.reduce((acc, b) => {
      acc[b.hostname] = (acc[b.hostname] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hostname, count]) => ({ hostname, count }))

  const filteredBackups = selectedHostname
    ? backups.filter(b => b.hostname === selectedHostname)
    : []

  return (
    <PageWrapper title="Config Backups">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-slate-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : (
        <div className="flex gap-4 h-[calc(100vh-180px)]">
          {/* Left: Device list */}
          <div className="w-64 flex-shrink-0 bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Devices</h2>
              <button
                onClick={fetchBackups}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-700/30">
              {hostnameGroups.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  No backups found
                </div>
              ) : (
                hostnameGroups.map(({ hostname, count }) => (
                  <button
                    key={hostname}
                    onClick={() => {
                      setSelectedHostname(hostname)
                      setSelectedBackup(null)
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors flex items-center justify-between ${
                      selectedHostname === hostname ? 'bg-slate-800 border-l-2 border-emerald-500' : ''
                    }`}
                  >
                    <div>
                      <p className="text-slate-200 text-xs font-mono font-medium">{hostname}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{count} backup{count !== 1 ? 's' : ''}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Middle: Backup list for selected device */}
          <div className="w-72 flex-shrink-0 bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-700/50">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {selectedHostname ? `${selectedHostname} Backups` : 'Select a Device'}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-700/30">
              {!selectedHostname ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  <FileCode className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                  Select a device from the left
                </div>
              ) : filteredBackups.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No backups for this device</div>
              ) : (
                filteredBackups.map((backup) => (
                  <button
                    key={backup._id}
                    onClick={() => setSelectedBackup(backup)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors ${
                      selectedBackup?._id === backup._id ? 'bg-slate-800 border-l-2 border-emerald-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Tag className="w-3 h-3 text-slate-500" />
                      <span className="text-slate-200 text-xs font-mono">{backup.version_label}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Clock className="w-3 h-3 text-slate-600" />
                      <span className="text-slate-500 text-xs">
                        {new Date(backup.backup_time).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TriggerBadge trigger={backup.triggered_by} />
                      <span className="text-slate-600 text-xs">{formatBytes(backup.size_bytes)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: Config text viewer */}
          <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-3">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <div>
                {selectedBackup ? (
                  <>
                    <span className="text-white text-sm font-mono">{selectedBackup.hostname}</span>
                    <span className="text-slate-500 text-xs ml-2">
                      {selectedBackup.version_label} &mdash; {new Date(selectedBackup.backup_time).toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400 text-sm">Select a backup to view</span>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {selectedBackup ? (
                <pre className="p-4 text-xs text-emerald-300 font-mono leading-relaxed whitespace-pre overflow-x-auto">
                  {selectedBackup.config_text}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FileCode className="w-12 h-12 text-slate-700 mb-3" />
                  <p className="text-slate-500 text-sm">Select a backup from the list to view its contents</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
