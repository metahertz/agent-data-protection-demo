'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Shield,
  LayoutDashboard,
  Server,
  Key,
  FileCode,
  ScrollText,
  Activity,
  MessageSquare,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/devices', label: 'Devices', icon: Server },
  { href: '/credentials', label: 'Credentials', icon: Key },
  { href: '/config-backups', label: 'Config Backups', icon: FileCode },
  { href: '/logs', label: 'Logs', icon: ScrollText },
  { href: '/telemetry', label: 'Telemetry', icon: Activity },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 min-h-screen bg-slate-900 border-r border-slate-700/50">
      {/* Logo / App Name */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <Shield className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <span className="text-white font-bold text-lg tracking-tight">NetGuard</span>
          <p className="text-slate-500 text-xs">Network Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-400'
                )}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700/50">
        <p className="text-xs text-slate-600">Educational Demo</p>
        <p className="text-xs text-slate-700">v0.1.0</p>
      </div>
    </div>
  )
}
