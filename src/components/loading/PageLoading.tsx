'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { spinnerVariants } from '@/lib/animations/variants';

export const PageLoading: React.FC = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          variants={spinnerVariants}
          animate="animate"
          className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground"
        >
          Loading...
        </motion.p>
      </div>
    </div>
  );
};

export const ContentLoading: React.FC<{ message?: string }> = ({
  message = 'Loading content...',
}) => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <motion.div
          variants={spinnerVariants}
          animate="animate"
          className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
        />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default PageLoading;
