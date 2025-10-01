# Routing Conflict Fix

**Date**: 2025-10-01  
**Issue**: Next.js route group conflict  
**Status**: ✅ Fixed

---

## 🚨 Problem

Next.js was throwing a routing error:

```
You cannot have two parallel pages that resolve to the same path. 
Please check /(dashboard)/page and /(frontend)/page.
```

### Root Cause

Two route groups were both trying to resolve to the root path `/`:

1. **`src/app/(dashboard)/page.tsx`** - Old dashboard page (unused)
2. **`src/app/(frontend)/page.tsx`** - Login page (active)

Both route groups `(dashboard)` and `(frontend)` are just grouping mechanisms in Next.js - they don't create URL segments. So both pages were trying to handle the `/` route, causing a conflict.

---

## ✅ Solution

**Removed the conflicting `(dashboard)` route group:**

### Files Deleted
1. `src/app/(dashboard)/page.tsx` - Old dashboard page with mock data
2. `src/app/(dashboard)/layout.tsx` - Old dashboard layout

### Why This Was Safe

The `(dashboard)` route group was **not being used**. The actual application structure is:

- **Root `/`**: `(frontend)/page.tsx` - Login page
- **Dashboard `/dashboard`**: `(frontend)/dashboard/page.tsx` - Real dashboard
- **Projects**: `(frontend)/dashboard/project/[id]/page.tsx` - Project pages

The old `(dashboard)` group was a leftover from an earlier structure and contained mock data.

---

## 📁 Current Route Structure

```
src/app/
├── (frontend)/              # Main application route group
│   ├── page.tsx            # Login page (/)
│   ├── layout.tsx          # Root layout
│   └── dashboard/          # Dashboard routes
│       ├── page.tsx        # Dashboard (/dashboard)
│       └── project/[id]/   # Project pages (/dashboard/project/:id)
│
├── (payload)/              # PayloadCMS admin route group
│   ├── admin/              # Admin UI (/admin)
│   └── api/                # Payload API
│
└── api/                    # API routes
    └── v1/                 # API v1 endpoints
```

---

## ✅ Verification

After removing the conflicting files:

1. **Server starts successfully** ✅
2. **No routing errors** ✅
3. **Login page loads at `/`** ✅
4. **Dashboard loads at `/dashboard`** ✅
5. **All routes working** ✅

---

## 📝 Next.js Route Groups Reminder

**Route groups** like `(dashboard)` and `(frontend)` are:
- **Organizational only** - They don't create URL segments
- **Used for layouts** - To apply different layouts to different sections
- **Must not conflict** - Can't have multiple `page.tsx` files that resolve to the same path

### Example

```
(frontend)/page.tsx        → /
(frontend)/dashboard/page.tsx → /dashboard
(dashboard)/page.tsx       → / (CONFLICT! ❌)
```

---

## 🎯 Lesson Learned

When using Next.js route groups:
1. **One page per path** - Only one `page.tsx` can resolve to each URL
2. **Clean up old routes** - Remove unused route groups to avoid conflicts
3. **Test routing** - Always verify routes after structural changes

---

**Status**: ✅ Fixed and verified  
**Server**: Running on http://localhost:3000  
**Impact**: No data loss, only removed unused files

