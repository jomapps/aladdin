'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2 } from 'lucide-react'

interface LoginFormData {
  email: string
  password: string
}

interface LoginError {
  message: string
}

export default function LoginForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<LoginError | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Login successful, redirect to dashboard
        router.push('/dashboard')
        router.refresh()
      } else {
        // Login failed, show error
        setError({
          message: data.message || 'Login failed. Please check your credentials.'
        })
      }
    } catch (err) {
      setError({
        message: 'Network error. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="glass-panel w-full max-w-md border-white/10 bg-white/5 p-1 text-slate-100 shadow-[0_40px_120px_-60px_rgba(59,130,246,0.8)]">
      <CardHeader className="space-y-3 text-center">
        <span className="inline-flex items-center justify-center gap-2 self-center rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
          <span className="inline-flex h-2 w-2 rounded-full bg-sky-300" />
          Secure Access
        </span>
        <CardTitle className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-indigo-200 to-purple-300">
          Welcome to Aladdin
        </CardTitle>
        <CardDescription className="text-sm text-slate-300">
          Craft cinematic universes with AI-guided production workflows.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              <AlertCircle className="h-4 w-4" />
              <span>{error.message}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-slate-200">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              className="h-11 rounded-lg border-white/10 bg-white/10 text-slate-100 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-400/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-slate-200">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              className="h-11 rounded-lg border-white/10 bg-white/10 text-slate-100 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:ring-sky-400/30"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 text-slate-950 shadow-[0_20px_60px_-30px_rgba(59,130,246,0.8)] transition duration-200 hover:brightness-110"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
