

# Plan: Add Comprehensive "Forgot Password" Flow

## Overview
Implement a complete password reset flow with two new pages (`/forgot-password` and `/reset-password`), add a "Forgot Password?" link to the existing sign-in form, and ensure the visual design matches the premium "billion-dollar" aesthetic established in the app.

---

## User Flow Diagram

```text
┌─────────────────┐     clicks      ┌──────────────────────┐
│   Sign In Form  │ ──────────────▶ │  /forgot-password    │
│   (/me page)    │  "Forgot        │  - Email input       │
│                 │   Password?"    │  - Submit button     │
└─────────────────┘                 └──────────────────────┘
                                              │
                                              │ calls supabase.auth
                                              │ .resetPasswordForEmail()
                                              ▼
                                    ┌──────────────────────┐
                                    │   Email Sent         │
                                    │   (User receives     │
                                    │    reset link)       │
                                    └──────────────────────┘
                                              │
                                              │ user clicks email link
                                              ▼
                                    ┌──────────────────────┐
                                    │  /reset-password     │
                                    │  - New password      │
                                    │  - Confirm password  │
                                    │  - Submit button     │
                                    └──────────────────────┘
                                              │
                                              │ calls supabase.auth
                                              │ .updateUser()
                                              ▼
                                    ┌──────────────────────┐
                                    │   Success!           │
                                    │   Redirect to /me    │
                                    └──────────────────────┘
```

---

## Changes

### 1. Create `/forgot-password` Page

**New File:** `src/pages/ForgotPassword.tsx`

A premium-styled page with:
- Teal gradient header (matching the Me page auth UI)
- PawPrint icon in frosted circle
- "Reset Your Password" heading with friendly subtext
- Email input field with Mail icon
- "Send Reset Link" primary button
- "Back to Sign In" link
- Toast notifications for success/error feedback
- Input validation using zod schema

**Design Elements:**
- Uses the same `bg-gradient-to-b from-[hsl(165,35%,55%)] via-[hsl(165,30%,65%)] to-background` gradient as Me.tsx
- Same card styling with `rounded-2xl shadow-lg`
- Same input styling: `rounded-xl border-[hsl(45,25%,80%)] bg-white h-12`

### 2. Create `/reset-password` Page

**New File:** `src/pages/ResetPassword.tsx`

A premium-styled page with:
- Same teal gradient aesthetic
- Lock icon in frosted circle
- "Create New Password" heading
- Password input field
- Confirm password input field
- "Update Password" primary button
- Password strength indicator (visual feedback)
- Toast notifications for success/error
- Automatic redirect to /me on success
- Handles the recovery session from Supabase auth event

**Key Technical Details:**
- Uses `supabase.auth.onAuthStateChange` to detect `PASSWORD_RECOVERY` event
- Validates that both passwords match before submission
- Minimum password length validation (6 characters)

### 3. Add "Forgot Password?" Link to Me.tsx

**File:** `src/pages/Me.tsx`

Add a link between the password input and the Sign In button:

```tsx
{/* After password input, before submit button */}
{isLogin && (
  <div className="text-right">
    <Link 
      to="/forgot-password"
      className="text-sm text-[hsl(165,40%,45%)] hover:underline"
    >
      Forgot password?
    </Link>
  </div>
)}
```

### 4. Add New Routes to App.tsx

**File:** `src/App.tsx`

Register the two new routes outside the AppLayout (they don't need the bottom nav):

```tsx
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// In Routes...
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/ForgotPassword.tsx` | Create | Email input page for password reset |
| `src/pages/ResetPassword.tsx` | Create | New password entry page |
| `src/pages/Me.tsx` | Modify | Add "Forgot password?" link |
| `src/App.tsx` | Modify | Register new routes |

---

## Implementation Details

### ForgotPassword.tsx Structure

```tsx
// Key imports
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, PawPrint, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

// Email validation schema
const emailSchema = z.string().email('Please enter a valid email address');

// Component with:
// - email state
// - isSubmitting state
// - handleSubmit that calls supabase.auth.resetPasswordForEmail()
// - redirectTo set to `${window.location.origin}/reset-password`
```

### ResetPassword.tsx Structure

```tsx
// Key imports
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, PawPrint, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Component with:
// - password, confirmPassword states
// - isSubmitting, isRecoveryMode states
// - useEffect that listens for PASSWORD_RECOVERY event
// - handleSubmit that calls supabase.auth.updateUser({ password })
// - Password match validation
// - Success state with auto-redirect to /me
```

### Supabase Reset Email Configuration

The `resetPasswordForEmail` call will use this redirect URL:
```typescript
const redirectUrl = `${window.location.origin}/reset-password`;

await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: redirectUrl,
});
```

This ensures the password reset email link directs users to the `/reset-password` page where they can set their new password.

---

## Visual Design Specifications

Both new pages will match the existing premium aesthetic:

**Header Section:**
- Gradient background: `from-[hsl(165,35%,55%)] via-[hsl(165,30%,65%)] to-background`
- Centered icon in frosted glass circle: `bg-[hsl(165,35%,45%)] rounded-full`
- Bold italic heading in dark teal: `text-[hsl(165,40%,25%)]`

**Form Card:**
- White card with shadow: `rounded-2xl shadow-lg p-6`
- Input fields: `rounded-xl border-[hsl(45,25%,80%)] bg-white h-12`
- Primary button: `bg-primary hover:bg-primary/90 rounded-xl h-12`

**Links:**
- Teal accent color: `text-[hsl(165,40%,45%)]`
- Hover underline effect

---

## Security Considerations

1. **Input Validation**: Email and password inputs validated using zod
2. **No Sensitive Logging**: No console.log of passwords or tokens
3. **Error Handling**: Generic error messages to avoid user enumeration
4. **Session Handling**: Password recovery session properly detected via auth events

---

## Testing Checklist

After implementation:
1. Navigate to `/me` and verify "Forgot password?" link appears only in Sign In mode (not Sign Up)
2. Click "Forgot password?" and verify navigation to `/forgot-password`
3. Enter an email and submit - verify success toast appears
4. Click the link in the reset email and verify navigation to `/reset-password`
5. Enter mismatched passwords and verify error feedback
6. Enter matching valid passwords and verify success + redirect to `/me`
7. Test on mobile viewport to ensure responsive design

