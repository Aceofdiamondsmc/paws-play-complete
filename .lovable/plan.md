

## Plan: Sync all legal/support dialogs across Me.tsx and Landing.tsx

### Context
The `public/` HTML files are the canonical source of truth. The in-app dialogs in both `src/pages/Me.tsx` and `src/pages/Landing.tsx` contain outdated text that needs to match.

Regarding the external `Paws-Play_Repeat_Legal` GitHub repo: Lovable cannot sync to a second repo. After this update, you can manually copy the three `public/*.html` files into that repo.

### Changes (2 files)

**`src/pages/Me.tsx`** — Update three dialog content blocks:
- **Privacy**: Date → March 16, 2026. Add PII collection details (Email/Name via Apple/Google), Supabase storage, account deletion section.
- **ToS**: Simplify acceptance, update conduct (illegal/offensive/harassing), update safety (maintenance/safety/condition), update termination (our discretion, without notice).
- **Support**: Reorder list to Location → Account Questions → Missing a park.

**`src/pages/Landing.tsx`** — Same three dialog updates, identical content to Me.tsx.

### Not in scope
- No logic changes
- No new dependencies
- Cross-navigation links in Landing.tsx footer remain intact
- Contact email already consistent (`info@pawsplayrepeat.app`)

