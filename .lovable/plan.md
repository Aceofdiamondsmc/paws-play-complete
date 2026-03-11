

## Update "SOS" Terminology to "Pack Alert"

Five files need text/label changes. No logic or structural changes required.

### Files & Changes

**1. `src/components/lost-dog/LostDogFAB.tsx`**
- Button label: `SOS` → `Pack Alert`
- aria-label: `Report lost dog` → `Report Pack Alert`

**2. `src/components/lost-dog/LostDogAlertModal.tsx`**
- Dialog title: `Report Lost Dog` → `Report Pack Alert`
- Success toast: `Lost dog alert sent! Check the Social feed.` → `Pack Alert sent! Check the Social feed.`

**3. `src/hooks/useLostDogAlerts.tsx`**
- Social post content: `🚨 [LOST DOG] 🚨` → `🚨 PAWS ALERT 🚨` and update body text to say `[Dog Name] is missing!`
- Resolve status value: `'found'` → `'reunited'` (stored in DB — needs matching update to any queries filtering on this value)
  - Note: `fetchActiveAlerts` only filters by `status: 'active'`, so changing `'found'` to `'reunited'` won't break the active query.

**4. `src/pages/Social.tsx`** (lines 277-294)
- Banner headline: `LOST DOG: {name}` → `🚨 PAWS ALERT: {name} is missing!`
- Comment: `Lost Dog Alerts Banner` → `Pack Alerts Banner`

**5. `supabase/functions/lost-dog-alert/index.ts`**
- Push notification heading: `🚨 LOST DOG: {dog_name}` → `🚨 PAWS ALERT: {dog_name} is missing!`
- Content text updated to match new branding

### Resolved Status Mapping

The `resolveAlert` function will update status to `'reunited'` instead of `'found'`. If a resolved alert banner is ever displayed (currently only active alerts render), it would show:
- Label: **✅ PACK REUNITED**
- Subtext: **Safe & Sound**
- Color: green

This status mapping will be added as a helper in `Social.tsx` for when resolved alerts are rendered alongside active ones.

