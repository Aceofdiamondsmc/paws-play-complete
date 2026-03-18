

## Fix: Allow Unauthenticated Access to Social Tab

### Problem
Line 221-222 in `Social.tsx` redirects unauthenticated users to the Landing page (`/`):
```tsx
if (!authLoading && !user) {
  return <Navigate to="/" replace />;
}
```

### Solution
**`src/pages/Social.tsx`** — Remove the auth redirect (lines 221-223). The social feed should be viewable by anyone. Post-creation and interactive features (like, comment) already check for `user` before allowing actions, so no additional guards are needed.

This restores the original behavior where the Social tab is a public, read-only feed for unauthenticated users.

