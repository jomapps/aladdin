'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hover?: boolean
  press?: boolean
  delay?: number
}

/**
 * AnimatedCard - Extends shadcn Card with framer-motion animations
 *
 * Features:
 * - Fade-in animation on mount
 * - Hover lift animation
 * - Tap feedback animation
 * - Configurable animation delays
 */
export const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, hover = true, press = true, delay = 0, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay }}
        whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
        whileTap={press ? { scale: 0.98 } : undefined}
      >
        <Card className={cn('transition-shadow hover:shadow-md', className)} {...props}>
          {children}
        </Card>
      </motion.div>
    )
  },
)

AnimatedCard.displayName = 'AnimatedCard'

// Re-export shadcn Card sub-components for convenience
export {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

export default AnimatedCard
