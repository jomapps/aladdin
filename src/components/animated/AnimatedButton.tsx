'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import type { VariantProps } from 'class-variance-authority'

interface AnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  asChild?: boolean
}

/**
 * AnimatedButton - Extends shadcn Button with framer-motion animations
 *
 * Features:
 * - Hover scale animation
 * - Tap feedback animation
 * - Loading state with spinner
 * - All shadcn Button variants and sizes
 */
export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      variant = 'default',
      size = 'default',
      isLoading = false,
      className,
      children,
      disabled,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    // Don't animate if disabled or loading
    const shouldAnimate = !disabled && !isLoading

    return (
      <motion.div
        whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.1 }}
        className="inline-flex"
      >
        <Button
          ref={ref}
          variant={variant}
          size={size}
          className={cn(className)}
          disabled={disabled || isLoading}
          asChild={asChild}
          {...props}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {children}
            </>
          ) : (
            children
          )}
        </Button>
      </motion.div>
    )
  },
)

AnimatedButton.displayName = 'AnimatedButton'

export default AnimatedButton
