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
import { Film, Calendar, Clock, ArrowRight } from 'lucide-react'
import { CreateProjectDialog } from '@/components/dashboard/CreateProjectDialog'

export default function ProjectsPage() {
  const router = useRouter()
  const { data, isLoading, error } = useProjects()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-100">My Projects</h1>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-48 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-100">My Projects</h1>
        </div>
        <Card className="rounded-3xl border border-rose-300/30 bg-rose-500/10 text-rose-100">
          <CardContent className="pt-6 text-sm">
            Failed to load projects. Please try again.
          </CardContent>
        </Card>
      </div>
    )
  }

  const projects = data?.docs || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">My Projects</h1>
          <p className="mt-1 text-slate-400">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="rounded-3xl border border-dashed border-white/15 bg-white/5 text-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Film className="mb-4 h-12 w-12 text-slate-300" />
            <h3 className="mb-2 text-lg font-semibold">No projects yet</h3>
            <p className="mb-6 max-w-md text-sm text-slate-400">
              Get started by creating your first movie production project
            </p>
            <CreateProjectDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-0 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/10 hover:shadow-[0_50px_140px_-80px_rgba(124,58,237,0.75)]"
              onClick={() => router.push(`/dashboard/project/${project.id}`)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 via-transparent to-purple-500/10 opacity-0 transition duration-500 group-hover:opacity-100" />
              <CardHeader className="relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="mb-3 text-xl font-semibold text-slate-100 transition group-hover:text-sky-200">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-slate-300">
                      {project.logline || 'No description'}
                    </CardDescription>
                  </div>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                    <Film className="h-5 w-5 text-slate-200" />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4 text-sm text-slate-300">
                  {/* Project Type & Genre */}
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.25em]">
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-slate-200">
                      {project.type || 'Movie'}
                    </span>
                    {project.genre && project.genre.length > 0 && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300">
                        {project.genre[0].genre}
                      </span>
                    )}
                  </div>

                  {/* Status & Phase */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      <Clock className="h-3.5 w-3.5 text-slate-300" />
                      <span className="capitalize tracking-wide">{project.phase || 'expansion'}</span>
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
                      <span className="capitalize text-slate-300">
                        {project.status || 'active'}
                      </span>
                    </div>
                  </div>

                  {/* Created Date */}
                  {project.createdAt && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5 text-slate-300" />
                      <span className="tracking-wide">
                        Created {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    className="mt-5 w-full border-white/20 bg-white/10 text-slate-100 transition group-hover:border-white/40 group-hover:bg-white/20"
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
        <div className="mt-8 flex justify-center gap-3">
          <Button
            variant="outline"
            disabled={!data.hasPrevPage}
            className="border-white/20 bg-white/10 text-slate-200 hover:border-white/40 hover:bg-white/20"
            onClick={() => {
              // TODO: Implement pagination
            }}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-slate-300">
            Page {data.page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={!data.hasNextPage}
            className="border-white/20 bg-white/10 text-slate-200 hover:border-white/40 hover:bg-white/20"
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
