

## Rename `/explore` route to `/services`

It's a straightforward find-and-replace across ~10 files. Worth doing for URL consistency with the "Services" label users see.

### Changes

**Routes — `src/App.tsx`**
- `/explore` → `/services`, `/explore/:id` → `/services/:id`

**Bottom Nav — `src/components/layout/BottomNav.tsx`**
- `path: '/explore'` → `path: '/services'`

**In-app navigation calls (4 files)**
- `src/pages/Explore.tsx` — two `navigate('/explore/${id}')` → `/services/${id}`
- `src/pages/SubmitService.tsx` — `navigate('/explore')` → `/services`
- `src/pages/SubmissionSuccess.tsx` — `navigate('/explore')` → `/services`
- `src/pages/ServiceDetails.tsx` — `navigate('/explore')` → `/services`, update button text "Back to Explore" → "Back to Services"

**Edge function return URLs (2 files)**
- `supabase/functions/customer-portal/index.ts` — return_url `/explore` → `/services`
- `supabase/functions/create-trial-checkout/index.ts` — success/cancel URLs `/explore` → `/services`

No file renames needed (the component files under `src/components/explore/` and the page file `Explore.tsx` can keep their names — those are internal).

