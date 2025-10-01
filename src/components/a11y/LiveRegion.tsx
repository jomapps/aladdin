'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Live Region Component
 * ARIA live region for announcing dynamic content changes
 */
interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
  clearOnUnmount?: boolean;
  className?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  priority = 'polite',
  atomic = true,
  clearOnUnmount = true,
  className = '',
}) => {
  const regionRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!regionRef.current || !message) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Clear the region first
    regionRef.current.textContent = '';

    // Set message after a brief delay to ensure it's announced
    timeoutRef.current = setTimeout(() => {
      if (regionRef.current) {
        regionRef.current.textContent = message;
      }
    }, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (clearOnUnmount && regionRef.current) {
        regionRef.current.textContent = '';
      }
    };
  }, [message, clearOnUnmount]);

  return (
    <div
      ref={regionRef}
      role={priority === 'assertive' ? 'alert' : 'status'}
      aria-live={priority}
      aria-atomic={atomic}
      className={`sr-only ${className}`.trim()}
    />
  );
};

/**
 * Hook for managing live region announcements
 */
export const useLiveRegion = (
  priority: 'polite' | 'assertive' = 'polite'
) => {
  const [message, setMessage] = React.useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const announce = React.useCallback((text: string, delay: number = 0) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setMessage(text);
      }, delay);
    } else {
      setMessage(text);
    }
  }, []);

  const clear = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setMessage('');
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    message,
    announce,
    clear,
    LiveRegionComponent: () => (
      <LiveRegion message={message} priority={priority} />
    ),
  };
};
