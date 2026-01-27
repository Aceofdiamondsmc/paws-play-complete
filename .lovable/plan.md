

## Redirect Authenticated Users to /me After Sign-In

This plan ensures users are automatically navigated to the `/me` route upon successful authentication, whether via email/password or Google OAuth.

---

### Current Behavior

| Sign-in Method | Current Redirect |
|----------------|------------------|
| Email/Password | Stays on `/me` page (no navigation needed, but page doesn't update immediately) |
| Google OAuth | Redirects to `/` (landing page) |
| Email Confirmation Link | Redirects to `/` (landing page) |

---

### Solution Overview

Three changes are needed to cover all authentication scenarios:

| Change | File | Purpose |
|--------|------|---------|
| 1 | `src/pages/Landing.tsx` | Redirect authenticated users away from landing page |
| 2 | `src/hooks/useAuth.tsx` | Update OAuth and email redirect URLs to `/me` |
| 3 | `src/pages/Me.tsx` | Navigate to `/me` after successful email/password sign-in |

---

### Implementation Details

#### 1. Update Landing.tsx - Redirect Authenticated Users

Add a `useEffect` that checks if the user is authenticated and redirects them to `/me`:

```typescript
import { useAuth } from '@/hooks/useAuth';

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { prefetchStats } = useStats();

  // Redirect authenticated users to /me
  useEffect(() => {
    if (!loading && user) {
      navigate('/me', { replace: true });
    }
  }, [user, loading, navigate]);

  // ... rest of component
}
```

This handles the case where OAuth or email confirmation redirects to `/`.

#### 2. Update useAuth.tsx - Change OAuth Redirect URLs

Update both the `signUp` and `signInWithGoogle` functions to redirect to `/me`:

**signUp function (line 118):**
```typescript
const redirectUrl = `${window.location.origin}/me`;
```

**signInWithGoogle function (line 130):**
```typescript
const redirectUrl = `${window.location.origin}/me`;
```

This ensures the browser redirects directly to `/me` after Google OAuth completes.

#### 3. Update Me.tsx - Navigate After Email/Password Sign-In

The `handleSubmit` function should navigate after successful sign-in:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!email || !password) {
    toast.error('Please fill in all fields');
    return;
  }

  setIsSubmitting(true);
  try {
    const { error } = isLogin 
      ? await signIn(email, password)
      : await signUp(email, password);

    if (error) {
      toast.error(error.message);
    } else if (!isLogin) {
      toast.success('Check your email to confirm your account!');
    } else {
      // Successful login - navigate to /me (forces re-render with authenticated state)
      navigate('/me', { replace: true });
    }
  } finally {
    setIsSubmitting(false);
  }
};
```

---

### Authentication Flow After Changes

```text
                     +------------------+
                     |   User Signs In  |
                     +------------------+
                              |
        +---------------------+---------------------+
        |                     |                     |
   Email/Password        Google OAuth         Email Confirm
        |                     |                     |
        v                     v                     v
   handleSubmit()      OAuth redirectTo      Email redirectTo
   calls navigate()    set to /me            set to /me
        |                     |                     |
        v                     v                     v
   +--------------------------------------------------+
   |              User lands on /me                   |
   +--------------------------------------------------+
                              |
              (If lands on / by accident)
                              |
                              v
                 Landing.tsx useEffect
                 detects user & redirects
                              |
                              v
                     User sees /me page
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Landing.tsx` | Add `useAuth` hook and `useEffect` to redirect authenticated users |
| `src/hooks/useAuth.tsx` | Update `redirectUrl` in `signUp` and `signInWithGoogle` to `/me` |
| `src/pages/Me.tsx` | Add `navigate('/me')` after successful `signIn` call |

---

### Technical Notes

- Using `{ replace: true }` in `navigate()` prevents the user from navigating back to the landing/login page with the browser back button
- The `loading` check in Landing.tsx prevents premature redirect while auth state is still being determined
- This approach handles all three sign-in methods: email/password, Google OAuth, and email confirmation links

