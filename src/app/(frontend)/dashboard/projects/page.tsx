'use client'

/**
 * Projects List Page
 * Displays all projects for the authenticated user
 */

import React from 'react'
import { useRouter } from 'next/navigation'
import { useProjects } from '@/lib/react-query/queries/projects'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Film, Plus, Calendar, Clock, ArrowRight } from 'lucide-react'
import { CreateProjectDialog } from '@/components/dashboard/CreateProjectDialog'

export default function ProjectsPage() {
  const router = useRouter()
  const { data, isLoading, error } = useProjects()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Failed to load projects. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const projects = data?.docs || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-600 mt-1">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Film className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              Get started by creating your first movie production project
            </p>
            <CreateProjectDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => router.push(`/dashboard/project/${project.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 group-hover:text-indigo-600 transition-colors">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.logline || 'No description'}
                    </CardDescription>
                  </div>
                  <Film className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Project Type & Genre */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md font-medium">
                      {project.type || 'Movie'}
                    </span>
                    {project.genre && project.genre.length > 0 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                        {project.genre[0].genre}
                      </span>
                    )}
                  </div>

                  {/* Status & Phase */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span className="capitalize">{project.phase || 'expansion'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          project.status === 'active'
                            ? 'bg-green-500'
                            : project.status === 'completed'
                              ? 'bg-blue-500'
                              : 'bg-gray-400'
                        }`}
                      />
                      <span className="capitalize">{project.status || 'active'}</span>
                    </div>
                  </div>

                  {/* Created Date */}
                  {project.createdAt && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Created {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    className="w-full mt-4 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/dashboard/project/${project.id}`)
                    }}
                  >
                    Open Project
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination (if needed) */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            disabled={!data.hasPrevPage}
            onClick={() => {
              // TODO: Implement pagination
            }}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {data.page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={!data.hasNextPage}
            onClick={() => {
              // TODO: Implement pagination
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

