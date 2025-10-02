import React from 'react'
import '@/app/globals.css'
import { Toaster } from '@/components/ui/sonner'

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
    <html lang="en">
      <body>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
