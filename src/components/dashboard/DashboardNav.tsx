'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LogOut, User, Menu, X, Sparkles } from 'lucide-react'

interface User {
  id: string
  email: string
  name?: string
}

interface DashboardNavProps {
  user: User
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        router.push('/')
        router.refresh()
      } else {
        console.error('Logout failed')
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const displayName = user.name || user.email

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl shadow-[0_12px_70px_-35px_rgba(56,189,248,0.65)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/40 bg-sky-500/20 shadow-[0_28px_50px_-25px_rgba(56,189,248,0.7)]">
              <Sparkles className="h-5 w-5 text-sky-200" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold uppercase tracking-[0.25em] text-white">
                Aladdin
              </h1>
              <p className="hidden text-xs font-medium text-slate-300 md:block">
                AI Movie Production Platform
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-4 md:flex">
            <div className="flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/60 px-4 py-2 text-slate-200 shadow-[0_10px_40px_-30px_rgba(14,165,233,0.6)]">
              <User className="h-4 w-4 text-sky-300" />
              <span className="text-sm font-medium tracking-wide text-white/90">{displayName}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 border-slate-600/70 bg-slate-900/60 text-white transition duration-200 hover:border-sky-400/50 hover:bg-slate-900/80"
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="border border-slate-700/70 bg-slate-900/60 text-white hover:border-sky-400/40 hover:bg-slate-900/80"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/70 pb-6 pt-4">
            <Card className="glass-panel border-slate-700/70 bg-slate-900/70 p-4 text-white shadow-[0_24px_80px_-45px_rgba(59,130,246,0.8)]">
              <div className="flex items-center gap-2 text-white">
                <User className="h-4 w-4 text-sky-300" />
                <span className="text-sm font-medium">{displayName}</span>
              </div>
              <div className="mt-4 flex items-center justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full border-slate-600/70 bg-slate-900/60 text-white hover:border-sky-400/40 hover:bg-slate-900/80"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </nav>
  )
}
