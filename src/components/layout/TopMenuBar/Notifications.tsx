'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Notifications() {
  const [hasNotifications] = useState(false)

  return (
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
      {hasNotifications && (
        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
      )}
    </Button>
  )
}
