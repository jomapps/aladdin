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
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_10px_60px_-30px_rgba(56,189,248,0.45)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-[0_20px_40px_-20px_rgba(124,58,237,0.6)]">
              <Sparkles className="h-5 w-5 text-sky-200" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-indigo-200 to-purple-300">
                Aladdin
              </h1>
              <p className="hidden text-xs font-medium text-slate-300 md:block">
                AI Movie Production Platform
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-4 md:flex">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-200 shadow-[0_10px_40px_-30px_rgba(14,165,233,0.6)]">
              <User className="h-4 w-4 text-sky-300" />
              <span className="text-sm font-medium tracking-wide">{displayName}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 border-white/20 bg-white/10 text-slate-100 transition duration-200 hover:border-white/40 hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoggingOut ? 'Signing out…' : 'Sign Out'}</span>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="border border-white/10 bg-white/10 text-slate-100 hover:bg-white/20"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 pb-6 pt-4">
            <Card className="glass-panel border-white/10 bg-white/5 p-4 shadow-[0_20px_70px_-40px_rgba(59,130,246,0.7)]">
              <div className="flex items-center gap-2 text-slate-200">
                <User className="h-4 w-4 text-sky-300" />
                <span className="text-sm font-medium">{displayName}</span>
              </div>
              <div className="mt-4 flex items-center justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full border-white/20 bg-white/10 text-slate-100 hover:border-white/40 hover:bg-white/20"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isLoggingOut ? 'Signing out…' : 'Sign Out'}</span>
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </nav>
  )
}
