'use client'

/**
 * Gather Page Client Component
 * Main client-side component for the Gather page
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ProjectSidebar from '../components/ProjectSidebar'
import MobileNav from '../components/MobileNav'
import DepartmentCards from '@/components/gather/DepartmentCards'
import GatherList from '@/components/gather/GatherList'
import GatherPagination from '@/components/gather/GatherPagination'
import { GatherQueryOptions } from '@/lib/gather/types'

interface GatherPageClientProps {
  projectId: string
  projectName: string
}

export default function GatherPageClient({ projectId, projectName }: GatherPageClientProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'latest' | 'oldest' | 'a-z' | 'z-a'>('latest')
  const [hasImage, setHasImage] = useState<boolean | undefined>(undefined)
  const [hasDocument, setHasDocument] = useState<boolean | undefined>(undefined)

  // Fetch gather items
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['gather-items', projectId, page, search, sort, hasImage, hasDocument],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sort,
      })

      if (search) params.append('search', search)
      if (hasImage !== undefined) params.append('hasImage', hasImage.toString())
      if (hasDocument !== undefined) params.append('hasDocument', hasDocument.toString())

      const response = await fetch(`/api/v1/gather/${projectId}?${params}`)
      if (!response.ok) throw new Error('Failed to fetch gather items')
      return response.json()
    },
  })

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1) // Reset to first page on search
  }

  const handleSortChange = (value: string) => {
    setSort(value as 'latest' | 'oldest' | 'a-z' | 'z-a')
    setPage(1)
  }

  const handleFilterChange = (filter: 'image' | 'document' | 'all') => {
    if (filter === 'all') {
      setHasImage(undefined)
      setHasDocument(undefined)
    } else if (filter === 'image') {
      setHasImage(true)
      setHasDocument(undefined)
    } else if (filter === 'document') {
      setHasImage(undefined)
      setHasDocument(true)
    }
    setPage(1)
  }

  const handleEvaluate = async (departmentSlug: string, departmentNumber: number) => {
    try {
      toast.info(`Starting evaluation for ${departmentSlug} department...`)

      // Navigate to project readiness page which will trigger evaluation
      router.push(`/dashboard/project/${projectId}/project-readiness?evaluate=${departmentSlug}`)
    } catch (error) {
      console.error('[GatherPage] Evaluation error:', error)
      toast.error('Failed to start department evaluation')
    }
  }

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Mobile Navigation */}
      <MobileNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} projectName={projectName} />

      <div className="flex h-screen">
        {/* Sidebar */}
        <ProjectSidebar
          projectId={projectId}
          projectName={projectName}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-slate-950/60">
          <div className="flex min-h-full flex-col">
            {/* Header */}
            <div className="border-b border-slate-800/70 bg-slate-950/80 px-6 py-5 shadow-[0_24px_80px_-45px_rgba(15,23,42,0.9)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-white">Gather</h1>
                  <p className="mt-1 text-sm text-slate-300/90">
                    Unqualified Content Collection for {projectName}
                  </p>
                </div>
                {data && (
                  <div className="flex items-baseline gap-2 text-slate-200">
                    <span className="text-lg text-slate-400">Items:</span>
                    <span className="text-3xl font-bold text-white">{data.total}</span>
                  </div>
                )}
              </div>

              {/* Search and Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search gather items..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={sort} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="a-z">A-Z</SelectItem>
                    <SelectItem value="z-a">Z-A</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={hasImage === true ? 'image' : hasDocument === true ? 'document' : 'all'}
                  onValueChange={(value) =>
                    handleFilterChange(value as 'image' | 'document' | 'all')
                  }
                >
                  <SelectTrigger className="w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="image">With Image</SelectItem>
                    <SelectItem value="document">With Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-10">
                {/* Department Cards Section */}
                <div>
                  <h2 className="mb-4 text-xl font-semibold text-white">Core Departments</h2>
                  <DepartmentCards projectId={projectId} onEvaluate={handleEvaluate} />
                </div>

                {/* Gather Items Section */}
                <div>
                  <h2 className="mb-4 text-xl font-semibold text-white">Gathered Content</h2>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-800/60 bg-slate-900/50" />
                      ))}
                    </div>
                  ) : error ? (
                    <div className="text-center py-12">
                      <p className="text-lg text-rose-300">Failed to load gather items</p>
                      <Button
                        onClick={() => refetch()}
                        className="mt-4 border-slate-700/70 bg-slate-900/60 text-white hover:border-sky-400/40 hover:bg-slate-900/80"
                      >
                        Retry
                      </Button>
                    </div>
                  ) : data && data.items.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-slate-300">No gather items found</p>
                      <p className="mt-2 text-sm text-slate-400">
                        Start collecting content using the AI chat
                      </p>
                    </div>
                  ) : (
                    <>
                      <GatherList
                        items={data?.items || []}
                        projectId={projectId}
                        onUpdate={refetch}
                      />

                      {data && data.pages > 1 && (
                        <div className="mt-6">
                          <GatherPagination
                            currentPage={page}
                            totalPages={data.pages}
                            hasMore={data.hasMore}
                            onPageChange={setPage}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
