import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-16 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 shadow-sm transition-colors outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20',
        'aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
