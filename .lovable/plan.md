

## Plan: Delete Account + Update Landing Page Dialogs

### 1. New Edge Function: `supabase/functions/delete-account/index.ts`
- CORS headers, OPTIONS handling
- Authenticate user via `supabase.auth.getUser()` using the Authorization header
- Create service-role client, call `supabase.auth.admin.deleteUser(userId)`
- Returns 200 on success, 401/500 on error

### 2. Config: `supabase/config.toml`
- Add `[functions.delete-account]` with `verify_jwt = false`

### 3. `src/pages/Me.tsx` (lines 546-579)
- Import `Trash2` from lucide-react and `AlertDialog` components
- Add state `showDeleteConfirm`
- Add a red "Delete Account" row at the bottom of the Legal & Support card
- Add `AlertDialog` with destructive confirmation — calls the edge function, signs out, navigates to `/`

### 4. `src/pages/Landing.tsx` — Update all three dialogs (lines 123-199)

**Privacy Policy dialog** (unchanged content, add footer links):
- Add clickable footer: "Terms of Service | Support" that opens the other dialogs

**Terms of Service dialog** — replace with updated 5-section content:
- Last Updated: March 16, 2026
- Sections: Acceptance of Terms, User Conduct & Content, Safety Disclaimer, Account Termination, Contact Us
- Add footer: "Privacy Policy | Support"

**Support dialog** — add "Account Questions?" bullet + footer:
- New bullet: "Account Questions? If you need help with your profile or wish to request data deletion, please email us from your registered account email."
- Add footer: "Privacy Policy | Terms of Service"

### 5. Update hosted HTML files
- `public/tos.html` — match new 5-section TOS content
- `public/support.html` — add "Account Questions?" bullet + footer links
- `public/privacy.html` — add footer links

