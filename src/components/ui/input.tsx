import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-9 w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-1 text-base text-gray-900 shadow-sm transition-colors outline-none placeholder:text-gray-500 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-900 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/20',
        'aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
