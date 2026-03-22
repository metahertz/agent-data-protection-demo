'use client'

import { useState, useEffect } from 'react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Activity, RefreshCw, Thermometer, Cpu, HardDrive, Network, Clock, AlertTriangle } from 'lucide-react'
import { formatUptime, formatBytes } from '@/lib/utils'

interface TelemetryEntry {
  _id: string
  hostname: string
  polled_at: string
  cpu_percent: number
  memory_percent: number
  uptime_seconds: number
  temperature_celsius: number | null
  port_count: number
  ports_up: number
  ports_down: number
  tx_bytes: number
  rx_bytes: number
}

interface DeviceStatus {
  hostname: string
  status: string
}

function ProgressBar({ value, max = 100, warning = 70, critical = 90 }: {
  value: number
  max?: number
  warning?: number
  critical?: number
}) {
  const pct = Math.min(100, (value / max) * 100)
  const color = pct >= critical ? 'bg-red-500' : pct >= warning ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="w-full bg-slate-700 rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    online: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    offline: 'bg-red-500/10 text-red-400 border border-red-500/30',
    degraded: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles.online}`}>
      {status}
    </span>
  )
}

export default function TelemetryPage() {
  const [telemetry, setTelemetry] = useState<TelemetryEntry[]>([])
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = async () => {
    try {
      const [telRes, devRes] = await Promise.all([
        fetch('/api/telemetry'),
        fetch('/api/devices'),
      ])
      if (telRes.ok) {
        const data = await telRes.json()
        setTelemetry(data.telemetry || [])
        setLastRefresh(new Date())
      }
      if (devRes.ok) {
        const data = await devRes.json()
        const statusMap: Record<string, string> = {}
        for (const d of (data.devices || [])) {
          statusMap[d.hostname] = d.status
        }
        setDeviceStatuses(statusMap)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  // Sort: offline/degraded first, then by hostname
  const sortedTelemetry = [...telemetry].sort((a, b) => {
    const statusOrder = { offline: 0, degraded: 1, online: 2 }
    const aStatus = deviceStatuses[a.hostname] || 'online'
    const bStatus = deviceStatuses[b.hostname] || 'online'
    if (statusOrder[aStatus as keyof typeof statusOrder] !== statusOrder[bStatus as keyof typeof statusOrder]) {
      return statusOrder[aStatus as keyof typeof statusOrder] - statusOrder[bStatus as keyof typeof statusOrder]
    }
    return a.hostname.localeCompare(b.hostname)
  })

  return (
    <PageWrapper title="Telemetry">
      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Now
        </button>
        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={e => setAutoRefresh(e.target.checked)}
            className="rounded border-slate-600"
          />
          Auto-refresh every 10s
        </label>
        {lastRefresh && (
          <span className="text-xs text-slate-600">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
        )}
        <span className="text-xs text-slate-600 ml-auto">
          {telemetry.length} devices polled
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-slate-600 animate-spin" />
        </div>
      ) : telemetry.length === 0 ? (
        <div className="text-center py-20">
          <Activity className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">No telemetry data. Load sample data from Settings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {sortedTelemetry.map((t) => {
            const status = deviceStatuses[t.hostname] || 'online'
            const isOffline = status === 'offline'
            const tempAlert = t.temperature_celsius !== null && t.temperature_celsius > 70
            const cpuAlert = t.cpu_percent > 75
            const memAlert = t.memory_percent > 85

            return (
              <div
                key={t._id}
                className={`bg-slate-900 rounded-xl border transition-all ${
                  isOffline
                    ? 'border-red-500/30 opacity-70'
                    : status === 'degraded'
                    ? 'border-amber-500/30'
                    : (tempAlert || cpuAlert || memAlert)
                    ? 'border-amber-500/20'
                    : 'border-slate-700/50'
                }`}
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-700/30 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-mono font-semibold">{t.hostname}</p>
                    <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatUptime(t.uptime_seconds)}
                    </p>
                  </div>
                  <StatusBadge status={status} />
                </div>

                {/* Metrics */}
                <div className="p-4 space-y-3">
                  {isOffline ? (
                    <div className="flex items-center justify-center py-4 gap-2 text-slate-600">
                      <AlertTriangle className="w-4 h-4 text-red-500/50" />
                      <span className="text-sm">Device offline</span>
                    </div>
                  ) : (
                    <>
                      {/* CPU */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Cpu className="w-3 h-3" /> CPU
                          </span>
                          <span className={`text-xs font-mono font-medium ${cpuAlert ? 'text-amber-400' : 'text-slate-300'}`}>
                            {t.cpu_percent}%
                          </span>
                        </div>
                        <ProgressBar value={t.cpu_percent} warning={70} critical={85} />
                      </div>

                      {/* Memory */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <HardDrive className="w-3 h-3" /> Memory
                          </span>
                          <span className={`text-xs font-mono font-medium ${memAlert ? 'text-red-400' : 'text-slate-300'}`}>
                            {t.memory_percent}%
                          </span>
                        </div>
                        <ProgressBar value={t.memory_percent} warning={75} critical={90} />
                      </div>

                      {/* Temperature */}
                      {t.temperature_celsius !== null && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Thermometer className="w-3 h-3" /> Temperature
                          </span>
                          <span className={`text-xs font-mono font-medium ${
                            tempAlert ? 'text-red-400' :
                            t.temperature_celsius > 60 ? 'text-amber-400' : 'text-slate-300'
                          }`}>
                            {t.temperature_celsius}°C
                            {tempAlert && ' ⚠'}
                          </span>
                        </div>
                      )}

                      {/* Ports */}
                      {t.port_count > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Network className="w-3 h-3" /> Ports
                          </span>
                          <span className="text-xs text-slate-300">
                            <span className="text-emerald-400">{t.ports_up}</span>
                            <span className="text-slate-600">/{t.port_count}</span>
                            {t.ports_down > 0 && (
                              <span className="text-red-400 ml-1">(-{t.ports_down})</span>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Traffic */}
                      {(t.tx_bytes > 0 || t.rx_bytes > 0) && (
                        <div className="pt-2 border-t border-slate-700/30 flex justify-between text-xs text-slate-500">
                          <span>TX: {formatBytes(t.tx_bytes)}</span>
                          <span>RX: {formatBytes(t.rx_bytes)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PageWrapper>
  )
}
