# Theme Color Fixes

## Color Mapping

Replace hardcoded colors with theme variables:

### Text Colors
- `text-gray-900` → `text-foreground`
- `text-gray-800` → `text-foreground`
- `text-gray-700` → `text-foreground`
- `text-gray-600` → `text-muted-foreground`
- `text-gray-500` → `text-muted-foreground`

### Background Colors
- `bg-gray-50` → `bg-muted/50`
- `bg-gray-100` → `bg-muted`
- `bg-white` → `bg-background` or `bg-card`

### Border Colors
- `border-gray-200` → `border-border`
- `border-gray-300` → `border-border`

### Accent Colors (keep but add dark mode support)
- `bg-purple-100` → `bg-primary/10`
- `text-purple-600` → `text-primary`
- `bg-indigo-100` → `bg-primary/10`
- `text-indigo-600` → `text-primary`

### Hover States
- `hover:bg-gray-50` → `hover:bg-muted/50`
- `hover:border-gray-300` → `hover:border-border`

## Files to Fix

1. ✅ QueryMode.tsx - DONE
2. ChatMode.tsx
3. DataMode.tsx
4. TaskMode.tsx
5. ModeSelector.tsx
6. MessageInput.tsx
7. ChatArea.tsx

