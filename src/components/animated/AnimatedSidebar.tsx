'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sidebarVariants, sidebarContentVariants } from '@/lib/animations/variants';
import { cn } from '@/lib/utils';

interface AnimatedSidebarProps {
  isCollapsed: boolean;
  children: React.ReactNode;
  className?: string;
  collapsedWidth?: number;
  expandedWidth?: number;
}

export const AnimatedSidebar: React.FC<AnimatedSidebarProps> = ({
  isCollapsed,
  children,
  className,
  collapsedWidth = 64,
  expandedWidth = 256,
}) => {
  const variants = {
    collapsed: {
      width: `${collapsedWidth}px`,
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
    expanded: {
      width: `${expandedWidth}px`,
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
  };

  return (
    <motion.aside
      initial={isCollapsed ? 'collapsed' : 'expanded'}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      variants={variants}
      className={cn(
        'relative flex flex-col overflow-hidden border-r bg-background',
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isCollapsed ? 'collapsed' : 'expanded'}
          initial="collapsed"
          animate="expanded"
          exit="collapsed"
          variants={sidebarContentVariants}
          className="flex h-full flex-col"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.aside>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export const AnimatedSidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  isCollapsed,
  isActive = false,
  onClick,
}) => {
  return (
    <motion.button
      whileHover={{ backgroundColor: 'hsl(var(--accent))' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="truncate"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default AnimatedSidebar;
