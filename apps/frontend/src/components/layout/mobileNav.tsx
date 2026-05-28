'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Switch } from '@cryptonext/ui/switch'
import {
  Globe,
  LayoutDashboard,
  Menu,
  Moon,
  Shield,
  Sun,
  Table,
  X,
} from 'lucide-react'
import { useTheme } from 'next-themes'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/events', label: 'Events', icon: Table },
  { path: '/ips', label: 'IP Analysis', icon: Globe },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <>
      <header className="bg-card/80 border-border fixed top-0 right-0 left-0 z-50 flex h-16 items-center justify-between border-b px-4 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Shield className="text-primary h-5 w-5" />
          <span className="text-sm font-semibold">CryptoWatch</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-muted-foreground p-2"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {open && (
        <div className="bg-background/95 fixed inset-0 top-16 z-40 p-4 backdrop-blur-xl">
          <nav className="space-y-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                href={path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  pathname === path
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <label className="border-border text-muted-foreground hover:bg-muted mt-4 flex w-full cursor-pointer items-center justify-between rounded-lg border-t px-4 py-3 text-sm font-medium transition-colors">
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
              onCheckedChange={(checked) =>
                setTheme(checked ? 'dark' : 'light')
              }
              aria-label="Toggle dark mode"
            />
          </label>
        </div>
      )}
    </>
  )
}
