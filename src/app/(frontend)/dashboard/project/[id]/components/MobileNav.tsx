'use client'

/**
 * Mobile Navigation Drawer
 * Phase 7: Production Polish
 */

interface MobileNavProps {
  onToggleSidebar: () => void
  projectName: string
}

export default function MobileNav({ onToggleSidebar, projectName }: MobileNavProps) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle navigation"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-900 truncate flex-1 mx-3">
          {projectName}
        </h1>
        <div className="w-10" /> {/* Spacer for balance */}
      </div>
    </header>
  )
}
