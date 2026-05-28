import type { Metadata } from 'next'

import { Inter, JetBrains_Mono } from 'next/font/google'

import { cn } from '@cryptonext/ui'
import '@cryptonext/ui/globals.css'

import { MobileNav } from '@/components/layout/mobileNav'
import { Sidebar } from '@/components/layout/sidebar'

import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'CryptoNext – Crypto Events Dashboard',
  description: 'Analytics dashboard for cryptographic asset events',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={cn(inter.variable, jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground font-sans">
        <Providers>
          <div className="bg-background min-h-screen font-sans">
            {/* Desktop sidebar */}
            <div className="hidden lg:block">
              <Sidebar />
            </div>

            {/* Mobile nav */}
            <div className="lg:hidden">
              <MobileNav />
            </div>

            {/* Main content */}
            <main className="min-h-screen lg:ml-64">
              <div className="p-4 pt-20 md:p-6 lg:p-8 lg:pt-8">{children}</div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
