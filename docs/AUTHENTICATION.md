# Aladdin - Authentication & Authorization

**Version**: 0.1.0  
**Last Updated**: January 28, 2025  
**Parent Document**: [SPECIFICATION.md](./SPECIFICATION.md)

---

## Overview

Aladdin uses **PayloadCMS built-in authentication** with a simple model:
- **Two states**: Logged in or Not logged in
- **No roles or permissions**: All authenticated users have full access
- **Session-based**: PayloadCMS handles cookies and sessions

---

## 1. Authentication Flow

### Route Protection

```
/ (homepage)              → Public (login page)
/api/v1/*                 → Requires authentication
/dashboard/*              → Requires authentication (redirect to / if not logged in)
```

### Implementation

**Homepage with Login**
```typescript
// app/page.tsx (Server Component)
import { redirect } from 'next/navigation';
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import LoginForm from './LoginForm';

export default async function HomePage() {
  const payload = await getPayloadHMR({ config: configPromise });
  const { user } = await payload.auth({ req });
  
  if (user) {
    redirect('/dashboard');
  }
  
  return (
    <div>
      <h1>Aladdin - AI Movie Production</h1>
      <LoginForm />
    </div>
  );
}
```

**Protected Dashboard Layout**
```typescript
// app/dashboard/layout.tsx (Server Component)
import { redirect } from 'next/navigation';
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';

export default async function DashboardLayout({ children }) {
  const payload = await getPayloadHMR({ config: configPromise });
  const { user } = await payload.auth({ req });
  
  if (!user) {
    redirect('/');
  }
  
  return (
    <div>
      <DashboardNav user={user} />
      <main>{children}</main>
    </div>
  );
}
```

---

## 2. API Route Protection

### Middleware Pattern

```typescript
// lib/auth/withAuth.ts
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import { NextRequest, NextResponse } from 'next/server';

export function withAuth(handler: Function) {
  return async (req: NextRequest, context?: any) => {
    const payload = await getPayloadHMR({ config: configPromise });
    const { user } = await payload.auth({ req });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Attach user to request context
    (req as any).user = user;
    
    return handler(req, context);
  };
}
```

**Usage in API Routes**
```typescript
// app/api/v1/projects/route.ts
import { withAuth } from '@/lib/auth/withAuth';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withAuth(async (req: NextRequest) => {
  const user = (req as any).user;
  const body = await req.json();
  
  // Create project logic
  const project = await createProject({
    ...body,
    owner: user.id
  });
  
  return NextResponse.json(project);
});
```

---

## 3. User Management

### User Collection (PayloadCMS)

```typescript
// src/collections/Users.ts
import { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,  // Enable authentication
  
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true
    },
    {
      name: 'displayName',
      type: 'text'
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media'
    },
    {
      name: 'preferences',
      type: 'group',
      fields: [
        {
          name: 'theme',
          type: 'select',
          options: ['light', 'dark', 'auto'],
          defaultValue: 'auto'
        },
        {
          name: 'defaultModel',
          type: 'text',
          defaultValue: 'gpt-4'
        }
      ]
    }
  ]
};
```

---

## 4. Session Management

PayloadCMS handles sessions automatically:
- **Cookie-based**: Secure HTTP-only cookies
- **JWT tokens**: Stored in cookies
- **Auto-refresh**: Sessions refresh automatically
- **Logout**: Clears cookies and invalidates session

### Getting Current User

**In Server Components**
```typescript
import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';

const payload = await getPayloadHMR({ config: configPromise });
const { user } = await payload.auth({ req });

if (user) {
  console.log('Logged in as:', user.email);
}
```

**In API Routes**
```typescript
export async function GET(req: NextRequest) {
  const payload = await getPayloadHMR({ config: configPromise });
  const { user } = await payload.auth({ req });
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Use user data
}
```

**In Client Components (via API)**
```typescript
'use client';

import { useEffect, useState } from 'react';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then(res => res.json())
      .then(data => setUser(data.user));
  }, []);
  
  return <div>{user?.email}</div>;
}
```

---

## 5. Future Considerations

### Phase 1 (Current): Simple Auth
- Logged in / not logged in
- All users have full access
- Sufficient for MVP and early development

### Phase 2 (Future): Team Collaboration
- Project-level permissions (owner, editor, viewer)
- Team member management
- Share projects with specific users

### Phase 3 (Future): Advanced Permissions
- Role-based access control (RBAC)
- Fine-grained permissions per feature
- Organization/workspace support

**Note**: Current architecture supports future expansion without breaking changes.

---

**Status**: Authentication Specification Complete ✓  
**Next**: Video Generation Pipeline (Section 5)