'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ScrollText, RefreshCw, Search, AlertTriangle, Filter } from 'lucide-react'

interface DeviceLog {
  _id: string
  hostname: string
  timestamp: string
  severity: 'info' | 'warn' | 'error' | 'critical'
  facility: string
  message: string
}

const SEVERITY_STYLES: Record<string, { row: string; badge: string }> = {
  critical: {
    row: 'bg-red-500/5 hover:bg-red-500/10',
    badge: 'bg-red-500/20 text-red-300 border border-red-500/30',
  },
  error: {
    row: 'bg-orange-500/5 hover:bg-orange-500/10',
    badge: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  },
  warn: {
    row: 'bg-yellow-500/5 hover:bg-yellow-500/10',
    badge: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  },
  info: {
    row: 'hover:bg-slate-800/30',
    badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  },
}

const ALL_SEVERITIES = ['critical', 'error', 'warn', 'info']

export default function LogsPage() {
  const [logs, setLogs] = useState<DeviceLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>(ALL_SEVERITIES)
  const [deviceFilter, setDeviceFilter] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 50

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      })
      if (selectedSeverities.length < ALL_SEVERITIES.length) {
        params.set('severity', selectedSeverities.join(','))
      }
      if (search) params.set('search', search)

      const res = await fetch(`/api/logs?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }, [selectedSeverities, search, offset])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const toggleSeverity = (sev: string) => {
    setSelectedSeverities(prev =>
      prev.includes(sev) ? prev.filter(s => s !== sev) : [...prev, sev]
    )
    setOffset(0)
  }

  const filteredLogs = deviceFilter
    ? logs.filter(l => l.hostname.toLowerCase().includes(deviceFilter.toLowerCase()))
    : logs

  return (
    <PageWrapper title="Device Logs">
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search messages..."
            value={search}
            onChange={e => { setSearch(e.target.value); setOffset(0) }}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Device filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Filter by device..."
            value={deviceFilter}
            onChange={e => setDeviceFilter(e.target.value)}
            className="w-48 pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Severity toggles */}
        <div className="flex items-center gap-1.5">
          {ALL_SEVERITIES.map(sev => {
            const styles = SEVERITY_STYLES[sev]
            const active = selectedSeverities.includes(sev)
            return (
              <button
                key={sev}
                onClick={() => toggleSeverity(sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  active ? styles.badge : 'bg-transparent text-slate-600 border-slate-700'
                }`}
              >
                {sev}
              </button>
            )
          })}
        </div>

        {/* Refresh */}
        <button
          onClick={() => fetchLogs()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="flex gap-2 mb-4 text-xs text-slate-500">
        <span>Showing {filteredLogs.length} of {total} entries</span>
        {offset > 0 && (
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            className="text-emerald-500 hover:text-emerald-400"
          >
            &larr; Previous
          </button>
        )}
        {offset + limit < total && (
          <button
            onClick={() => setOffset(offset + limit)}
            className="text-emerald-500 hover:text-emerald-400"
          >
            Next &rarr;
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-slate-600 animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Loading logs...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No logs found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/30">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider whitespace-nowrap">Timestamp</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Hostname</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Severity</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Facility</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {filteredLogs.map((log) => {
                  const style = SEVERITY_STYLES[log.severity] || SEVERITY_STYLES.info
                  return (
                    <tr key={log._id} className={`transition-colors ${style.row}`}>
                      <td className="px-4 py-2.5 font-mono text-slate-400 text-xs whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: 'short', day: '2-digit',
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-300 text-xs whitespace-nowrap">
                        {log.hostname}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style.badge}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-500 text-xs whitespace-nowrap">
                        {log.facility}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300 text-xs">
                        {log.message}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
