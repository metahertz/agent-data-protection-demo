import { connectDB } from '@/lib/mongodb'
import Device from '@/lib/models/Device'
import DeviceLog from '@/lib/models/DeviceLog'
import Telemetry from '@/lib/models/Telemetry'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { formatUptime } from '@/lib/utils'
import {
  Server,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Activity,
  Thermometer,
  Cpu,
} from 'lucide-react'

async function getDashboardData() {
  try {
    await connectDB()

    const [devices, recentLogs, telemetry] = await Promise.all([
      Device.find({}).lean(),
      DeviceLog.find({ severity: { $in: ['error', 'critical'] } })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean(),
      Telemetry.find({}).lean(),
    ])

    const last24h = new Date(Date.now() - 86400000)
    const criticalAlerts = await DeviceLog.countDocuments({
      severity: { $in: ['error', 'critical'] },
      timestamp: { $gte: last24h },
    })

    return { devices, recentLogs, telemetry, criticalAlerts }
  } catch {
    return { devices: [], recentLogs: [], telemetry: [], criticalAlerts: 0 }
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    online: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    offline: 'bg-red-500/10 text-red-400 border border-red-500/30',
    degraded: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    critical: 'bg-red-500/10 text-red-400 border border-red-500/30',
    error: 'bg-orange-500/10 text-orange-400 border border-orange-500/30',
    warn: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
    info: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles.info}`}>
      {status}
    </span>
  )
}

export default async function DashboardPage() {
  const { devices, recentLogs, telemetry, criticalAlerts } = await getDashboardData()

  const totalDevices = devices.length
  const onlineDevices = devices.filter(d => d.status === 'online').length
  const problemDevices = devices.filter(d => d.status !== 'online').length

  // Find alarming telemetry
  const alarmingTelemetry = telemetry.filter(t =>
    (t.temperature_celsius !== null && t.temperature_celsius > 65) ||
    t.cpu_percent > 75 ||
    t.memory_percent > 90
  )

  return (
    <PageWrapper title="Dashboard">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Devices"
          value={totalDevices}
          icon={<Server className="w-5 h-5 text-blue-400" />}
          color="blue"
        />
        <StatCard
          title="Online"
          value={onlineDevices}
          icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
          color="emerald"
        />
        <StatCard
          title="Degraded / Offline"
          value={problemDevices}
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
          color="amber"
        />
        <StatCard
          title="Critical Alerts (24h)"
          value={criticalAlerts}
          icon={<AlertCircle className="w-5 h-5 text-red-400" />}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Alerts */}
        <div className="xl:col-span-2 bg-slate-900 rounded-xl border border-slate-700/50">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              Recent Errors &amp; Critical Events
            </h2>
          </div>
          <div className="overflow-x-auto">
            {recentLogs.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">No recent alerts</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Time</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Device</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Severity</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {recentLogs.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap font-mono text-xs">
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs whitespace-nowrap">
                        {log.hostname}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={log.severity} />
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs max-w-xs truncate">
                        {log.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Device Status Summary */}
          <div className="bg-slate-900 rounded-xl border border-slate-700/50">
            <div className="px-6 py-4 border-b border-slate-700/50">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-400" />
                Device Status
              </h2>
            </div>
            <div className="divide-y divide-slate-700/30">
              {devices
                .filter(d => d.status !== 'online')
                .concat(devices.filter(d => d.status === 'online').slice(0, 5))
                .slice(0, 8)
                .map((device, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-slate-200 text-sm font-mono">{device.hostname}</p>
                      <p className="text-slate-500 text-xs">{device.ip_address}</p>
                    </div>
                    <StatusBadge status={device.status} />
                  </div>
                ))}
            </div>
          </div>

          {/* Alarming Telemetry */}
          {alarmingTelemetry.length > 0 && (
            <div className="bg-slate-900 rounded-xl border border-slate-700/50">
              <div className="px-6 py-4 border-b border-slate-700/50">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  Health Alerts
                </h2>
              </div>
              <div className="divide-y divide-slate-700/30">
                {alarmingTelemetry.map((t, i) => (
                  <div key={i} className="px-4 py-3">
                    <p className="text-slate-200 text-sm font-mono mb-2">{t.hostname}</p>
                    <div className="flex flex-wrap gap-2">
                      {t.cpu_percent > 75 && (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <Cpu className="w-3 h-3" /> CPU {t.cpu_percent}%
                        </span>
                      )}
                      {t.memory_percent > 90 && (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <Activity className="w-3 h-3" /> MEM {t.memory_percent}%
                        </span>
                      )}
                      {t.temperature_celsius !== null && t.temperature_celsius > 65 && (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <Thermometer className="w-3 h-3" /> {t.temperature_celsius}°C
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Uptime: {formatUptime(t.uptime_seconds)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}

function StatCard({
  title, value, icon, color
}: {
  title: string
  value: number
  icon: React.ReactNode
  color: 'blue' | 'emerald' | 'amber' | 'red'
}) {
  const borderColors = {
    blue: 'border-blue-500/30',
    emerald: 'border-emerald-500/30',
    amber: 'border-amber-500/30',
    red: 'border-red-500/30',
  }
  return (
    <div className={`bg-slate-900 rounded-xl border ${borderColors[color]} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-sm">{title}</span>
        {icon}
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}
