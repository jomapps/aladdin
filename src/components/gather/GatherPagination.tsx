'use client'

/**
 * Gather Pagination Component
 * Handles pagination for gather items list using shadcn Pagination
 */

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

interface GatherPaginationProps {
  currentPage: number
  totalPages: number
  hasMore: boolean
  onPageChange: (page: number) => void
}

export default function GatherPagination({
  currentPage,
  totalPages,
  hasMore,
  onPageChange,
}: GatherPaginationProps) {
  const canGoPrevious = currentPage > 1
  const canGoNext = hasMore && currentPage < totalPages

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = 5 // Maximum number of page buttons to show

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('ellipsis')
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => canGoPrevious && onPageChange(currentPage - 1)}
            className={cn(
              'border-slate-700/70 bg-slate-900/60 text-white hover:border-sky-400/40 hover:bg-slate-900/80',
              !canGoPrevious && 'pointer-events-none opacity-40'
            )}
          />
        </PaginationItem>

        {pageNumbers.map((page, index) =>
          page === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={currentPage === page}
                className={cn(
                  'cursor-pointer border-slate-700/70 bg-slate-900/60 text-white hover:border-sky-400/40 hover:bg-slate-900/80',
                  currentPage === page && 'border-sky-400/60 bg-sky-500/25 text-white shadow-[0_12px_40px_-30px_rgba(56,189,248,0.8)]'
                )}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() => canGoNext && onPageChange(currentPage + 1)}
            className={cn(
              'border-slate-700/70 bg-slate-900/60 text-white hover:border-sky-400/40 hover:bg-slate-900/80',
              !canGoNext && 'pointer-events-none opacity-40'
            )}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
