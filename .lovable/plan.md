

## Add Show/Hide Password Toggle on Login Page

The login/signup form in `Me.tsx` currently has a plain `type="password"` input with no visibility toggle. The Reset Password page already has this pattern implemented (Eye/EyeOff icons) — we'll replicate it.

### Changes

**File: `src/pages/Me.tsx`**

1. Import `Eye` and `EyeOff` from `lucide-react`
2. Add `const [showPassword, setShowPassword] = useState(false)` state
3. Wrap the password Input in a `relative` div and add the toggle button (same pattern as `ResetPassword.tsx`):
   - Change `type="password"` to `type={showPassword ? 'text' : 'password'}`
   - Add `pr-10` to the Input className
   - Add the eye icon button positioned `absolute right-3 top-1/2`

This is a small, self-contained change (~10 lines).

