'use client';

import React, { useEffect, useRef, ReactNode } from 'react';
import { getFocusableElements, storeFocus, restoreFocus } from '@/lib/a11y/focus';

/**
 * Focus Trap Component
 * Traps keyboard focus within a container (useful for modals)
 */
interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  restoreFocusOnUnmount?: boolean;
  initialFocus?: 'first' | 'last' | HTMLElement | null;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active = true,
  restoreFocusOnUnmount = true,
  initialFocus = 'first',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    // Store currently focused element
    previouslyFocusedRef.current = storeFocus();

    // Focus initial element
    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length > 0) {
      if (initialFocus === 'first') {
        focusableElements[0].focus();
      } else if (initialFocus === 'last') {
        focusableElements[focusableElements.length - 1].focus();
      } else if (initialFocus instanceof HTMLElement) {
        initialFocus.focus();
      }
    }

    // Handle tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !containerRef.current) return;

      const focusableElements = getFocusableElements(containerRef.current);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      }
      // Tab
      else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus when unmounting
      if (restoreFocusOnUnmount && previouslyFocusedRef.current) {
        restoreFocus(previouslyFocusedRef.current);
      }
    };
  }, [active, initialFocus, restoreFocusOnUnmount]);

  return <div ref={containerRef}>{children}</div>;
};
