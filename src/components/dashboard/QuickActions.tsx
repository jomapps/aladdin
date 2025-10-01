'use client'

import { useRouter } from 'next/navigation'
import { Film, Plus, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreateProjectDialog } from './CreateProjectDialog'

export function QuickActions() {
  const router = useRouter()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Create Project Card */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New Project</CardTitle>
          <Plus className="h-4 w-4 ml-auto text-indigo-600" />
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-4">
            Start a new movie production project
          </CardDescription>
          <CreateProjectDialog />
        </CardContent>
      </Card>

      {/* My Projects Card */}
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/projects')}>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">My Projects</CardTitle>
          <Film className="h-4 w-4 ml-auto text-indigo-600" />
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-4">
            View and manage your existing projects
          </CardDescription>
          <Button variant="outline" className="w-full" onClick={(e) => {
            e.stopPropagation()
            router.push('/dashboard/projects')
          }}>
            <Film className="h-4 w-4 mr-2" />
            View Projects
          </Button>
        </CardContent>
      </Card>

      {/* Team Card */}
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/team')}>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Team</CardTitle>
          <Users className="h-4 w-4 ml-auto text-indigo-600" />
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-4">
            Collaborate with your team members
          </CardDescription>
          <Button variant="outline" className="w-full" onClick={(e) => {
            e.stopPropagation()
            router.push('/dashboard/team')
          }}>
            <Users className="h-4 w-4 mr-2" />
            Manage Team
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

