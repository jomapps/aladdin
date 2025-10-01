/**
 * Transition Configuration
 * Standardized timing and easing functions
 */

import { Transition } from 'framer-motion';

/**
 * Duration constants (in seconds)
 */
export const DURATION = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.2,
  moderate: 0.3,
  slow: 0.4,
  slower: 0.5,
} as const;

/**
 * Easing functions
 */
export const EASING = {
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  sharp: [0.4, 0, 0.6, 1],
  smooth: [0.25, 0.1, 0.25, 1],
} as const;

/**
 * Standard transitions
 */
export const transitions = {
  fast: {
    duration: DURATION.fast,
    ease: EASING.easeOut,
  } as Transition,

  normal: {
    duration: DURATION.normal,
    ease: EASING.easeInOut,
  } as Transition,

  smooth: {
    duration: DURATION.moderate,
    ease: EASING.smooth,
  } as Transition,

  slow: {
    duration: DURATION.slow,
    ease: EASING.easeInOut,
  } as Transition,

  // Layout transitions
  layout: {
    duration: DURATION.moderate,
    ease: EASING.easeInOut,
  } as Transition,

  // Modal transitions
  modal: {
    duration: DURATION.moderate,
    ease: EASING.easeOut,
  } as Transition,

  // Fade transitions
  fade: {
    duration: DURATION.fast,
    ease: EASING.easeInOut,
  } as Transition,

  // Slide transitions
  slide: {
    duration: DURATION.moderate,
    ease: EASING.easeOut,
  } as Transition,

  // Scale transitions
  scale: {
    duration: DURATION.normal,
    ease: EASING.easeOut,
  } as Transition,
} as const;

/**
 * Stagger configuration
 */
export const stagger = {
  fast: {
    staggerChildren: 0.03,
  },
  normal: {
    staggerChildren: 0.05,
  },
  slow: {
    staggerChildren: 0.1,
  },
} as const;

/**
 * Delay helpers
 */
export const delay = (ms: number): Transition => ({
  delay: ms / 1000,
});

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get transition with reduced motion support
 */
export const getTransition = (
  transition: Transition,
  fallback: Transition = { duration: 0 }
): Transition => {
  return prefersReducedMotion() ? fallback : transition;
};

/**
 * Common transition presets
 */
export const presets = {
  button: transitions.fast,
  card: transitions.normal,
  modal: transitions.modal,
  sidebar: transitions.smooth,
  dropdown: transitions.fast,
  toast: transitions.slide,
  tab: transitions.normal,
  page: transitions.smooth,
} as const;
