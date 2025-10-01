'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Settings, User, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UserMenuProps {
  user?: {
    id: string
    email: string
    name?: string
  }
}

export default function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (!user) {
    return (
      <Button variant="ghost" size="sm">
        Sign In
      </Button>
    )
  }

  const displayName = user.name || user.email.split('@')[0]

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="gap-2 h-9"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4" />
        </div>
        <span className="hidden md:inline">{displayName}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-background border rounded-lg shadow-lg py-2 z-50">
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <button
              className="w-full px-4 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
              onClick={() => {
                setIsOpen(false)
                router.push('/settings')
              }}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              className="w-full px-4 py-2 text-sm text-left hover:bg-accent flex items-center gap-2 text-destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
