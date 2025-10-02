# Shadcn Components Analysis

## Already Installed Components

The following shadcn/ui components are already installed in `/src/components/ui/`:

- ✅ `button.tsx`
- ✅ `card.tsx`
- ✅ `form.tsx`
- ✅ `sonner.tsx` (toast notifications)
- ✅ `dialog.tsx`
- ✅ `label.tsx`
- ✅ `input.tsx`
- ✅ `textarea.tsx`
- ✅ `select.tsx`

## Missing Components (In Use)

These components are **currently being imported** but don't exist as shadcn components:

### HIGH PRIORITY (Already in Use)
1. **Alert** - Used in `project-readiness/page.tsx`
2. **Skeleton** - Used in `project-readiness/page.tsx` (custom version exists at `/src/components/Skeleton.tsx`)
3. **Badge** - Used in `ReadinessOverview.tsx` and `DepartmentCard.tsx`
4. **Progress** - Used in `ReadinessOverview.tsx` and `DepartmentCard.tsx`
5. **Avatar** - Used in `Message.tsx` and `StreamingMessage.tsx`

### MEDIUM PRIORITY (Referenced/Likely Needed)
6. **Dropdown Menu** - For `UserMenu.tsx` and navigation menus
7. **Popover** - For tooltips and popovers
8. **Separator** - Referenced in `select.tsx` (SelectSeparator)
9. **Tabs** - Custom `AnimatedTabs` exists, but shadcn tabs may be useful

### LOW PRIORITY (Optional/Future Use)
10. **Accordion** - For expandable sections
11. **ScrollArea** - For scrollable content

## Installation Commands

### High Priority (Install First)
```bash
# Install all high-priority components in one command
npx shadcn@latest add alert skeleton badge progress avatar
```

Or individually:
```bash
npx shadcn@latest add alert
npx shadcn@latest add skeleton
npx shadcn@latest add badge
npx shadcn@latest add progress
npx shadcn@latest add avatar
```

### Medium Priority (Install As Needed)
```bash
npx shadcn@latest add dropdown-menu
npx shadcn@latest add popover
npx shadcn@latest add separator
npx shadcn@latest add tabs
```

### Low Priority (Optional)
```bash
npx shadcn@latest add accordion
npx shadcn@latest add scroll-area
```

## Radix UI Dependencies

Already installed in `package.json`:
- `@radix-ui/react-dialog`
- `@radix-ui/react-label`
- `@radix-ui/react-select`
- `@radix-ui/react-slot`

Additional Radix dependencies will be installed automatically by shadcn when adding components.

## Notes

1. **Custom Skeleton Component**: There's already a custom skeleton implementation at `/src/components/Skeleton.tsx` and `/src/components/loading/LoadingSkeleton.tsx`. Consider migrating to shadcn's skeleton for consistency.

2. **Toast System**: Currently using `sonner` for toasts, which is already wrapped in `sonner.tsx`. This is sufficient for notifications.

3. **Import Conflicts**: After installing shadcn components, update imports in:
   - `/src/app/(frontend)/dashboard/project/[id]/project-readiness/page.tsx`
   - `/src/components/project-readiness/ReadinessOverview.tsx`
   - `/src/components/project-readiness/DepartmentCard.tsx`

## Recommended Action Plan

1. **Immediate**: Install high-priority components to fix broken imports
   ```bash
   npx shadcn@latest add alert skeleton badge progress avatar
   ```

2. **Short-term**: Install medium-priority components for UI completeness
   ```bash
   npx shadcn@latest add dropdown-menu popover separator tabs
   ```

3. **Optional**: Install low-priority components as needed
   ```bash
   npx shadcn@latest add accordion scroll-area
   ```

4. **Cleanup**: Remove or migrate custom skeleton implementations to use shadcn's version
