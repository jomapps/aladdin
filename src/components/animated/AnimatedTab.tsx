'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface AnimatedTabsProps {
  tabs: Array<{ id: string; label: string; icon?: React.ReactNode; content?: React.ReactNode }>
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

/**
 * AnimatedTabs - Extends shadcn Tabs with framer-motion animations
 *
 * Features:
 * - Smooth tab switching with layout animations
 * - Hover and tap feedback
 * - Content fade-in animations
 * - Icon support
 *
 * Can be used in controlled or uncontrolled mode
 */
export const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  defaultValue,
  value,
  onValueChange,
  className,
}) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue || tabs[0]?.id)

  const currentValue = value !== undefined ? value : activeTab

  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setActiveTab(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <Tabs value={currentValue} onValueChange={handleValueChange} className={className}>
      <TabsList className="relative">
        {tabs.map((tab) => (
          <motion.div
            key={tab.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative"
          >
            <TabsTrigger value={tab.id} className="relative flex items-center gap-2">
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
            </TabsTrigger>
          </motion.div>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id}>
          <AnimatedTabPanel>{tab.content}</AnimatedTabPanel>
        </TabsContent>
      ))}
    </Tabs>
  )
}

interface AnimatedTabPanelProps {
  children: React.ReactNode
  className?: string
}

/**
 * AnimatedTabPanel - Animated content wrapper for tab panels
 *
 * Features:
 * - Fade-in animation
 * - Slide-up animation
 */
export const AnimatedTabPanel: React.FC<AnimatedTabPanelProps> = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Re-export shadcn Tabs components for direct use
export { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default AnimatedTabs
