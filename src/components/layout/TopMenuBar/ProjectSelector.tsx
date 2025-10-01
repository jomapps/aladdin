'use client'

import { useState } from 'react'
import { ChevronDown, Plus, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProjectSelector() {
  const [selectedProject, setSelectedProject] = useState('My Project')

  return (
    <div className="hidden md:flex items-center gap-2">
      <Button variant="ghost" className="h-9 gap-2 px-3">
        <Folder className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{selectedProject}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  )
}
