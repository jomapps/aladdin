import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-lg border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-base text-slate-100 shadow-sm transition-colors outline-none placeholder:text-slate-400 file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-100 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-sky-400/60 focus-visible:ring-2 focus-visible:ring-sky-500/30',
        'aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/30',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
