'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Switch } from '@cryptonext/ui/switch'
import {
  Activity,
  Globe,
  LayoutDashboard,
  Moon,
  Shield,
  Sun,
  Table,
} from 'lucide-react'
import { useTheme } from 'next-themes'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/events', label: 'Events', icon: Table },
  { path: '/ips', label: 'IP Analysis', icon: Globe },
]

export function Sidebar() {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  // next-themes resolves the theme on the client only; gate UI until mounted
  // to avoid a hydration mismatch on first paint.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <aside className="bg-sidebar border-sidebar-border fixed top-0 left-0 z-50 flex h-screen w-64 flex-col border-r">
      {/* Logo */}
      <div className="border-sidebar-border border-b p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 border-primary/20 flex h-9 w-9 items-center justify-center rounded-lg border">
            <Shield className="text-primary h-5 w-5" />
          </div>
          <div>
            <h1 className="text-foreground text-sm font-semibold tracking-wide">
              CryptoWatch
            </h1>
            <p className="text-muted-foreground font-mono text-[11px]">
              Event Analytics
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <p className="text-muted-foreground mb-3 px-3 text-[10px] font-semibold tracking-widest uppercase">
          Navigation
        </p>
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = pathname === path
          return (
            <Link
              key={path}
              href={path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary border-primary/20 border'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-transparent'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {isActive && (
                <div className="bg-primary animate-pulse-glow ml-auto h-1.5 w-1.5 rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-sidebar-border space-y-1 border-t p-4">
        {/* Theme toggle */}
        <label className="text-sidebar-foreground hover:bg-sidebar-accent flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors duration-200">
          <div className="flex items-center gap-3">
            {isDark ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span>{isDark ? 'Dark mode' : 'Light mode'}</span>
          </div>
          <Switch
            checked={isDark}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            aria-label="Toggle dark mode"
          />
        </label>

        {/* Status */}
        <div className="flex items-center gap-2 px-3 py-2">
          <Activity className="text-success h-3.5 w-3.5" />
          <span className="text-muted-foreground text-xs">System Active</span>
        </div>
      </div>
    </aside>
  )
}
