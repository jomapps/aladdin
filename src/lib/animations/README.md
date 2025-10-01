# Animation Library

Comprehensive animation utilities using Framer Motion for consistent, performant animations throughout the application.

## Features

- **Pre-configured Variants**: Common animation patterns
- **Spring Configurations**: Physics-based animations
- **Transition Presets**: Standardized timing and easing
- **Gesture Handling**: Tap, drag, swipe, long-press
- **Reduced Motion Support**: Accessibility-first
- **Performance Optimized**: 60fps animations

## Usage

### Basic Animation

```tsx
import { motion } from 'framer-motion';
import { fadeInUpVariants, transitions } from '@/lib/animations';

function Component() {
  return (
    <motion.div
      variants={fadeInUpVariants}
      initial="hidden"
      animate="visible"
      transition={transitions.normal}
    >
      Content
    </motion.div>
  );
}
```

### Spring Animation

```tsx
import { motion } from 'framer-motion';
import { springs } from '@/lib/animations';

function Component() {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      transition={springs.bouncy}
    >
      Click me
    </motion.button>
  );
}
```

### Gesture Handling

```tsx
import { motion } from 'framer-motion';
import { detectSwipe, tapGesture } from '@/lib/animations';

function Component() {
  return (
    <motion.div
      onPanEnd={(_, info) => {
        const direction = detectSwipe(info);
        if (direction === 'left') handleSwipeLeft();
      }}
      whileTap={tapGesture}
    >
      Swipeable
    </motion.div>
  );
}
```

### Stagger Animation

```tsx
import { motion } from 'framer-motion';
import { staggerContainerVariants, staggerItemVariants } from '@/lib/animations';

function List() {
  return (
    <motion.ul variants={staggerContainerVariants} initial="hidden" animate="visible">
      {items.map((item) => (
        <motion.li key={item.id} variants={staggerItemVariants}>
          {item.name}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### Reduced Motion

```tsx
import { useReducedMotion } from '@/lib/animations';

function Component() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ x: reducedMotion ? 0 : 100 }}
      transition={{ duration: reducedMotion ? 0 : 0.3 }}
    >
      Content
    </motion.div>
  );
}
```

## Animation Guidelines

### Performance

- Use `transform` and `opacity` for animations
- Avoid animating `width`, `height`, `top`, `left`
- Keep animations under 300ms for UI interactions
- Use `will-change` sparingly
- Debounce scroll-triggered animations

### Accessibility

- Always respect `prefers-reduced-motion`
- Provide instant fallbacks for reduced motion
- Don't rely solely on animation for feedback
- Keep animations subtle and purposeful

### Best Practices

- Use spring animations for natural motion
- Apply easing functions consistently
- Stagger list animations for better UX
- Add loading states with animations
- Test on low-end devices

## Available Variants

- `fadeVariants` - Simple fade in/out
- `fadeInUpVariants` - Fade in from bottom
- `fadeInDownVariants` - Fade in from top
- `slideInLeftVariants` - Slide from left
- `slideInRightVariants` - Slide from right
- `scaleVariants` - Scale animation
- `modalBackdropVariants` - Modal backdrop
- `modalContentVariants` - Modal content
- `sidebarVariants` - Sidebar collapse/expand
- `staggerContainerVariants` - Stagger parent
- `staggerItemVariants` - Stagger children

## Transition Presets

- `transitions.fast` - 150ms
- `transitions.normal` - 200ms
- `transitions.smooth` - 300ms
- `transitions.slow` - 400ms
- `transitions.modal` - Modal-specific
- `transitions.sidebar` - Sidebar-specific

## Spring Presets

- `springs.gentle` - Smooth spring
- `springs.default` - Standard spring
- `springs.bouncy` - Bouncy spring
- `springs.stiff` - Fast spring
- `springs.slow` - Slow spring
- `springs.wobbly` - Wobbly spring
- `springs.snappy` - Quick spring
