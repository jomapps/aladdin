'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUpVariants } from '@/lib/animations/variants';
import { cn } from '@/lib/utils';

interface AnimatedMessageProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  role?: 'user' | 'assistant' | 'system';
}

export const AnimatedMessage: React.FC<AnimatedMessageProps> = ({
  children,
  className,
  delay = 0,
  role = 'assistant',
}) => {
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.15,
        delay,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      className={cn(
        'rounded-lg p-4 transition-colors',
        role === 'user' && 'bg-primary text-primary-foreground',
        role === 'assistant' && 'bg-muted',
        role === 'system' && 'bg-accent',
        className
      )}
    >
      {children}
    </motion.div>
  );
};

interface StreamingTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export const StreamingText: React.FC<StreamingTextProps> = ({
  text,
  speed = 20,
  className,
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = React.useState('');
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="ml-0.5 inline-block h-4 w-0.5 bg-current"
        />
      )}
    </span>
  );
};

export default AnimatedMessage;
