/**
 * Spring Animation Configurations
 * Physics-based animations for natural motion
 */

import { Transition } from 'framer-motion';

/**
 * Spring presets with different characteristics
 */
export const springs = {
  // Gentle, smooth spring
  gentle: {
    type: 'spring',
    stiffness: 120,
    damping: 20,
    mass: 0.5,
  } as Transition,

  // Default spring
  default: {
    type: 'spring',
    stiffness: 200,
    damping: 25,
    mass: 0.8,
  } as Transition,

  // Bouncy spring
  bouncy: {
    type: 'spring',
    stiffness: 300,
    damping: 20,
    mass: 1,
  } as Transition,

  // Stiff, fast spring
  stiff: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
    mass: 0.5,
  } as Transition,

  // Slow, smooth spring
  slow: {
    type: 'spring',
    stiffness: 80,
    damping: 20,
    mass: 1,
  } as Transition,

  // Wobbly spring
  wobbly: {
    type: 'spring',
    stiffness: 180,
    damping: 12,
    mass: 1,
  } as Transition,

  // Snappy spring
  snappy: {
    type: 'spring',
    stiffness: 500,
    damping: 35,
    mass: 0.5,
  } as Transition,
} as const;

/**
 * Spring presets for specific use cases
 */
export const springPresets = {
  button: springs.stiff,
  card: springs.default,
  modal: springs.gentle,
  sidebar: springs.default,
  dropdown: springs.snappy,
  drag: springs.bouncy,
  toggle: springs.stiff,
} as const;

/**
 * Create custom spring configuration
 */
export const createSpring = (
  stiffness: number = 200,
  damping: number = 25,
  mass: number = 0.8
): Transition => ({
  type: 'spring',
  stiffness,
  damping,
  mass,
});

/**
 * Spring with reduced motion support
 */
export const adaptiveSpring = (spring: Transition): Transition => {
  if (typeof window === 'undefined') return spring;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) {
    return { duration: 0 };
  }

  return spring;
};
