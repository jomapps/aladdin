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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-white/5 backdrop-blur-2xl lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-xl border border-white/10 bg-white/10 p-2 text-slate-100 transition duration-200 hover:border-white/30 hover:bg-white/20"
          aria-label="Toggle navigation"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="mx-3 flex-1 truncate text-base font-semibold text-slate-100">
          {projectName}
        </h1>
        <div className="w-10" />
      </div>
    </header>
  )
}
