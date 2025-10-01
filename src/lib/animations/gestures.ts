/**
 * Gesture Configurations
 * Tap, drag, hover, and pan gestures
 */

import { PanInfo, TapInfo } from 'framer-motion';

/**
 * Tap gesture configuration
 */
export const tapGesture = {
  scale: 0.95,
  transition: { duration: 0.1 },
};

/**
 * Hover gesture configuration
 */
export const hoverGesture = {
  scale: 1.02,
  transition: { duration: 0.15 },
};

/**
 * Drag gesture configuration
 */
export const dragGesture = {
  dragConstraints: { left: 0, right: 0, top: 0, bottom: 0 },
  dragElastic: 0.2,
  dragTransition: { bounceStiffness: 300, bounceDamping: 20 },
};

/**
 * Swipe gesture helpers
 */
export const SWIPE_THRESHOLD = 50;
export const SWIPE_VELOCITY_THRESHOLD = 500;

export const detectSwipe = (
  info: PanInfo
): 'left' | 'right' | 'up' | 'down' | null => {
  const { offset, velocity } = info;

  // Check horizontal swipe
  if (Math.abs(offset.x) > SWIPE_THRESHOLD) {
    if (
      offset.x > 0 &&
      velocity.x > SWIPE_VELOCITY_THRESHOLD
    ) {
      return 'right';
    }
    if (
      offset.x < 0 &&
      velocity.x < -SWIPE_VELOCITY_THRESHOLD
    ) {
      return 'left';
    }
  }

  // Check vertical swipe
  if (Math.abs(offset.y) > SWIPE_THRESHOLD) {
    if (
      offset.y > 0 &&
      velocity.y > SWIPE_VELOCITY_THRESHOLD
    ) {
      return 'down';
    }
    if (
      offset.y < 0 &&
      velocity.y < -SWIPE_VELOCITY_THRESHOLD
    ) {
      return 'up';
    }
  }

  return null;
};

/**
 * Long press gesture
 */
export const LONG_PRESS_DURATION = 500; // ms

export const createLongPress = (
  onLongPress: () => void,
  duration: number = LONG_PRESS_DURATION
) => {
  let timeout: NodeJS.Timeout;

  return {
    onTapStart: () => {
      timeout = setTimeout(onLongPress, duration);
    },
    onTap: () => {
      clearTimeout(timeout);
    },
    onTapCancel: () => {
      clearTimeout(timeout);
    },
  };
};

/**
 * Double tap gesture
 */
export const DOUBLE_TAP_THRESHOLD = 300; // ms

export const createDoubleTap = (
  onDoubleTap: () => void,
  threshold: number = DOUBLE_TAP_THRESHOLD
) => {
  let lastTap = 0;

  return {
    onTap: (event: MouseEvent | TouchEvent, info: TapInfo) => {
      const now = Date.now();
      if (now - lastTap < threshold) {
        onDoubleTap();
        lastTap = 0;
      } else {
        lastTap = now;
      }
    },
  };
};

/**
 * Pan gesture constraints
 */
export const createPanConstraints = (
  direction: 'horizontal' | 'vertical' | 'both' = 'both'
) => {
  switch (direction) {
    case 'horizontal':
      return { top: 0, bottom: 0 };
    case 'vertical':
      return { left: 0, right: 0 };
    case 'both':
    default:
      return {};
  }
};

/**
 * Momentum scroll
 */
export const momentumScroll = {
  power: 0.8,
  timeConstant: 700,
  restDelta: 0.5,
};
