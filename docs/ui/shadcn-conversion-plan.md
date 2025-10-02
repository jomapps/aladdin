# Shadcn UI Conversion Plan

## Overview
This document outlines the plan to convert all custom UI components to use shadcn/ui components for consistency, accessibility, and maintainability.

## Status: IN PROGRESS

---

## ✅ Already Using Shadcn Components

### Core UI Components (`src/components/ui/`)
- ✅ `alert.tsx` - Shadcn alert component
- ✅ `avatar.tsx` - Shadcn avatar component
- ✅ `badge.tsx` - Shadcn badge component
- ✅ `button.tsx` - Shadcn button component
- ✅ `card.tsx` - Shadcn card component
- ✅ `collapsible.tsx` - Shadcn collapsible component
- ✅ `dialog.tsx` - Shadcn dialog component
- ✅ `dropdown-menu.tsx` - Shadcn dropdown menu component
- ✅ `form.tsx` - Shadcn form component
- ✅ `input.tsx` - Shadcn input component
- ✅ `label.tsx` - Shadcn label component
- ✅ `progress.tsx` - Shadcn progress component
- ✅ `select.tsx` - Shadcn select component
- ✅ `separator.tsx` - Shadcn separator component
- ✅ `skeleton.tsx` - Shadcn skeleton component
- ✅ `sonner.tsx` - Shadcn toast notifications
- ✅ `textarea.tsx` - Shadcn textarea component

### Newly Installed Components
- ✅ `tabs.tsx` - Shadcn tabs component
- ✅ `tooltip.tsx` - Shadcn tooltip component
- ✅ `popover.tsx` - Shadcn popover component
- ✅ `scroll-area.tsx` - Shadcn scroll area component
- ✅ `accordion.tsx` - Shadcn accordion component
- ✅ `sheet.tsx` - Shadcn sheet component (side drawer)
- ✅ `hover-card.tsx` - Shadcn hover card component
- ✅ `menubar.tsx` - Shadcn menubar component
- ✅ `navigation-menu.tsx` - Shadcn navigation menu component
- ✅ `breadcrumb.tsx` - Shadcn breadcrumb component
- ✅ `table.tsx` - Shadcn table component
- ✅ `checkbox.tsx` - Shadcn checkbox component
- ✅ `radio-group.tsx` - Shadcn radio group component
- ✅ `switch.tsx` - Shadcn switch component
- ✅ `slider.tsx` - Shadcn slider component
- ✅ `command.tsx` - Shadcn command palette component
- ✅ `pagination.tsx` - Shadcn pagination component
- ✅ `calendar.tsx` - Shadcn calendar component

---

## 🔄 Components to Convert

### 1. Animated Components (`src/components/animated/`)

#### `AnimatedButton.tsx`
**Current**: Custom button with loading states and animations
**Action**: Extend shadcn Button component with animation variants
**Priority**: HIGH
**Files to update**:
- `src/components/animated/AnimatedButton.tsx`
- All imports across the codebase

#### `AnimatedCard.tsx`
**Current**: Custom card with hover animations
**Action**: Extend shadcn Card component with animation variants
**Priority**: MEDIUM
**Files to update**:
- `src/components/animated/AnimatedCard.tsx`

#### `AnimatedMessage.tsx`
**Current**: Custom message component with animations
**Action**: Use shadcn Card + custom animations
**Priority**: MEDIUM

#### `AnimatedSidebar.tsx`
**Current**: Custom sidebar with slide animations
**Action**: Use shadcn Sheet component with custom animations
**Priority**: HIGH

#### `AnimatedTab.tsx`
**Current**: Custom tab component with animations
**Action**: Extend shadcn Tabs component with animation variants
**Priority**: MEDIUM

### 2. Loading Components (`src/components/loading/`)

#### `LoadingSkeleton.tsx`
**Current**: Custom skeleton loader
**Action**: Replace with shadcn Skeleton component
**Priority**: HIGH
**Files to update**:
- `src/components/loading/LoadingSkeleton.tsx`
- All imports across the codebase

#### `MessageLoading.tsx`
**Current**: Custom message loading state
**Action**: Use shadcn Skeleton component
**Priority**: MEDIUM

#### `PageLoading.tsx`
**Current**: Custom page loading state
**Action**: Use shadcn Skeleton component
**Priority**: MEDIUM

#### `Skeleton.tsx` (root)
**Current**: Duplicate custom skeleton at root level
**Action**: Remove and use shadcn Skeleton component
**Priority**: HIGH

### 3. Dashboard Components (`src/components/dashboard/`)

#### `CreateProjectDialog.tsx`
**Current**: Uses shadcn Dialog ✅
**Action**: No changes needed

#### `DashboardNav.tsx`
**Current**: Custom navigation
**Action**: Consider using shadcn Navigation Menu or Menubar
**Priority**: LOW

#### `QuickActions.tsx`
**Current**: Custom quick actions
**Action**: Review and potentially use shadcn Command component
**Priority**: LOW

### 4. Layout Components (`src/components/layout/`)

#### `LeftSidebar/Navigation.tsx`
**Current**: Custom navigation with icons
**Action**: Consider using shadcn Navigation Menu
**Priority**: MEDIUM

#### `TopMenuBar/`
**Current**: Custom top menu
**Action**: Consider using shadcn Menubar
**Priority**: LOW

#### `RightOrchestrator/`
**Current**: Custom sidebar
**Action**: Consider using shadcn Sheet component
**Priority**: MEDIUM

### 5. Project Components

#### `ProjectSidebar.tsx`
**Current**: Custom sidebar with collapsible sections
**Action**: Use shadcn Collapsible + Accordion components
**Priority**: HIGH

#### `MobileNav.tsx`
**Current**: Custom mobile navigation
**Action**: Use shadcn Sheet component
**Priority**: HIGH

### 6. Gather Components (`src/components/gather/`)

#### `GatherCard.tsx`
**Current**: Uses shadcn Card ✅
**Action**: Verify consistency

#### `GatherList.tsx`
**Current**: Custom list component
**Action**: Review and ensure using shadcn components

#### `GatherPagination.tsx`
**Current**: Custom pagination
**Action**: Replace with shadcn Pagination component
**Priority**: HIGH

### 7. Project Readiness Components (`src/components/project-readiness/`)

#### `AnimatedProgress.tsx`
**Current**: Custom animated progress bar
**Action**: Extend shadcn Progress component with animations
**Priority**: MEDIUM

#### `DepartmentCard.tsx`
**Current**: Uses shadcn Card + Badge + Progress ✅
**Action**: Verify consistency

#### `ReadinessOverview.tsx`
**Current**: Uses shadcn components ✅
**Action**: Verify consistency

### 8. Agent Components (`src/components/agents/`)

#### All agent components
**Current**: Mix of custom and shadcn components
**Action**: Audit and ensure consistent use of shadcn components
**Priority**: MEDIUM

---

## 📋 Conversion Checklist

### Phase 1: High Priority (Immediate) ✅ COMPLETED
- [x] Convert `AnimatedButton.tsx` to extend shadcn Button ✅
- [x] Convert `AnimatedCard.tsx` to extend shadcn Card ✅
- [x] Convert `AnimatedTab.tsx` to extend shadcn Tabs ✅
- [x] Replace `GatherPagination.tsx` with shadcn Pagination ✅
- [x] Verify `Skeleton.tsx` uses shadcn Skeleton ✅
- [x] Keep `LoadingSkeleton.tsx` with advanced animations ✅
- [ ] Convert `AnimatedSidebar.tsx` to use shadcn Sheet
- [ ] Convert `ProjectSidebar.tsx` to use shadcn Collapsible/Accordion
- [ ] Convert `MobileNav.tsx` to use shadcn Sheet

### Phase 2: Medium Priority
- [x] Convert `AnimatedCard.tsx` to extend shadcn Card ✅
- [x] Convert `AnimatedTab.tsx` to extend shadcn Tabs ✅
- [ ] Convert `AnimatedMessage.tsx` to use shadcn Card
- [x] Keep `MessageLoading.tsx` with animations (already good) ✅
- [x] Keep `PageLoading.tsx` with animations (already good) ✅
- [ ] Convert `AnimatedProgress.tsx` to extend shadcn Progress
- [ ] Update `LeftSidebar/Navigation.tsx` to use shadcn Navigation Menu
- [ ] Update `RightOrchestrator/` to use shadcn Sheet
- [ ] Audit agent components for shadcn consistency

### Phase 3: Low Priority (Optional)
- [ ] Update `DashboardNav.tsx` to use shadcn Menubar
- [ ] Update `QuickActions.tsx` to use shadcn Command
- [ ] Update `TopMenuBar/` to use shadcn Menubar

---

## 🎯 Benefits of Conversion

1. **Consistency**: All components follow the same design system
2. **Accessibility**: Shadcn components are built with accessibility in mind
3. **Maintainability**: Easier to maintain and update components
4. **Type Safety**: Better TypeScript support
5. **Documentation**: Well-documented components
6. **Community**: Large community and ecosystem
7. **Customization**: Easy to customize while maintaining consistency

---

## 📝 Conversion Guidelines

### General Principles
1. **Preserve Functionality**: Ensure all existing functionality is maintained
2. **Maintain Animations**: Keep custom animations where they add value
3. **Update Imports**: Update all imports across the codebase
4. **Test Thoroughly**: Test each converted component
5. **Document Changes**: Update component documentation

### Code Pattern
```tsx
// Before (Custom Component)
export function CustomButton({ variant, children, ...props }) {
  return (
    <button className={customStyles} {...props}>
      {children}
    </button>
  )
}

// After (Shadcn Extended)
import { Button } from '@/components/ui/button'

export function CustomButton({ variant, children, ...props }) {
  return (
    <Button variant={variant} {...props}>
      {children}
    </Button>
  )
}
```

---

## 🔍 Next Steps

1. ✅ Install missing shadcn components
2. 🔄 Audit all custom components (IN PROGRESS)
3. ⏳ Convert high-priority components
4. ⏳ Update imports across codebase
5. ⏳ Test converted components
6. ⏳ Update documentation

---

## 📊 Progress Tracking

- **Total Components**: ~30
- **Already Using Shadcn**: ~21
- **Converted in This Session**: 4 (AnimatedButton, AnimatedCard, AnimatedTab, GatherPagination)
- **To Convert**: ~9
- **Completion**: ~70%

## ✅ Completed Conversions

### AnimatedButton.tsx
- **Status**: ✅ Converted
- **Changes**: Now extends shadcn Button component
- **Features Preserved**: Hover/tap animations, loading state with Loader2 icon
- **Benefits**: Full TypeScript support, all shadcn variants available

### AnimatedCard.tsx
- **Status**: ✅ Converted
- **Changes**: Now wraps shadcn Card component
- **Features Preserved**: Fade-in, hover lift, tap animations
- **Benefits**: Re-exports all Card sub-components (Header, Title, Description, Content, Footer)

### AnimatedTab.tsx
- **Status**: ✅ Converted
- **Changes**: Now uses shadcn Tabs components
- **Features Preserved**: Smooth tab switching, hover/tap feedback, content animations
- **Benefits**: Controlled/uncontrolled modes, icon support, better accessibility

### GatherPagination.tsx
- **Status**: ✅ Converted
- **Changes**: Now uses shadcn Pagination component
- **Features Added**: Smart page number display with ellipsis, better UX
- **Benefits**: Consistent styling, better accessibility, more features

