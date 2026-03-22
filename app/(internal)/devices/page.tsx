import { connectDB } from '@/lib/mongodb'
import Device from '@/lib/models/Device'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Router, Network, Wifi, Server } from 'lucide-react'

async function getDevices() {
  try {
    await connectDB()
    return await Device.find({}).sort({ hostname: 1 }).lean()
  } catch {
    return []
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    online: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    offline: 'bg-red-500/10 text-red-400 border border-red-500/30',
    degraded: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
  }
  const dots: Record<string, string> = {
    online: 'bg-emerald-400',
    offline: 'bg-red-400',
    degraded: 'bg-amber-400',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles.online}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status] || dots.online}`} />
      {status}
    </span>
  )
}

function TypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    router: <Router className="w-4 h-4 text-blue-400" />,
    switch: <Network className="w-4 h-4 text-purple-400" />,
    access_point: <Wifi className="w-4 h-4 text-cyan-400" />,
  }
  const labels: Record<string, string> = {
    router: 'Router',
    switch: 'Switch',
    access_point: 'Access Point',
  }
  return (
    <div className="flex items-center gap-2">
      {icons[type] || <Server className="w-4 h-4 text-slate-400" />}
      <span className="text-slate-300 text-xs">{labels[type] || type}</span>
    </div>
  )
}

export default async function DevicesPage() {
  const devices = await getDevices()

  const byStatus = {
    online: devices.filter(d => d.status === 'online').length,
    degraded: devices.filter(d => d.status === 'degraded').length,
    offline: devices.filter(d => d.status === 'offline').length,
  }

  return (
    <PageWrapper title="Devices">
      {/* Summary row */}
      <div className="flex gap-4 mb-6">
        {[
          { label: 'Total', count: devices.length, color: 'text-slate-300' },
          { label: 'Online', count: byStatus.online, color: 'text-emerald-400' },
          { label: 'Degraded', count: byStatus.degraded, color: 'text-amber-400' },
          { label: 'Offline', count: byStatus.offline, color: 'text-red-400' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-slate-900 rounded-lg border border-slate-700/50 px-4 py-3 flex items-center gap-3">
            <span className={`text-2xl font-bold ${color}`}>{count}</span>
            <span className="text-slate-400 text-sm">{label}</span>
          </div>
        ))}
      </div>

      {/* Devices Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h2 className="text-sm font-semibold text-white">All Devices ({devices.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/30">
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Hostname</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">IP Address</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Location</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Vendor / Model</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Firmware</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {devices.map((device) => (
                <tr
                  key={device._id?.toString()}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    device.status === 'offline' ? 'opacity-60' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-slate-200 font-medium">{device.hostname}</span>
                    <br />
                    <span className="font-mono text-slate-500 text-xs">{device.mac_address}</span>
                  </td>
                  <td className="px-4 py-3">
                    <TypeIcon type={device.type} />
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300 text-xs whitespace-nowrap">
                    {device.ip_address}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    <div>{device.location}</div>
                    {device.rack_unit && device.rack_unit !== 'N/A' && (
                      <div className="text-slate-600">{device.rack_unit}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-300 text-xs">{device.vendor}</div>
                    <div className="text-slate-500 text-xs">{device.model}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs whitespace-nowrap">
                    {device.firmware_version}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={device.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {devices.length === 0 && (
          <div className="p-12 text-center">
            <Server className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">No devices found. Load sample data from Settings.</p>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
