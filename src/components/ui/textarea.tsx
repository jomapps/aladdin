import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-20 w-full rounded-lg border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-base text-slate-100 shadow-sm transition-colors outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-sky-400/60 focus-visible:ring-2 focus-visible:ring-sky-500/30',
        'aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/30',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
