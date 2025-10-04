import React from 'react'
import '@/app/globals.css'
import { Inter, Space_Grotesk } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { GlobalErrorBanner } from '@/components/errors/GlobalErrorBanner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata = {
  description:
    'AI-powered video generation platform - Create stunning videos with artificial intelligence',
  title: 'Aladdin - AI Video Generation',
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased">
        <GlobalErrorBanner />
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
