

## Apply Pack Alert Notification Templates and Add Sound Effects

Update the push notification copy, social post content, resolution flow, and in-app alert sounds to match the three provided templates.

### Changes

**1. `supabase/functions/lost-dog-alert/index.ts`** -- Template 1 (Urgent)
- Heading: `🚨 PAWS ALERT: Missing Member!`
- Body: `[Dog Name] was last seen at [Location]. Our pack needs your eyes on the street. Tap for details and contact info.`

**2. `src/hooks/useLostDogAlerts.tsx`**
- Update social post content to match the urgent community tone: lead with `🚨 PAWS ALERT: Missing Member!` and include "Our pack needs your eyes on the street."
- In `resolveAlert`: after updating status to `'reunited'`, send a **resolution push notification** by invoking a new payload to the `lost-dog-alert` edge function with a `type: 'reunited'` flag.

**3. `supabase/functions/lost-dog-alert/index.ts`** -- Template 2 (Reunited)
- Accept an optional `type` field in the request body.
- When `type === 'reunited'`:
  - Heading: `🎉 Good News: Pack Reunited!`
  - Body: `[Dog Name] is Safe & Sound! Thank you to everyone who kept a lookout. The pack is back together!`

**4. `src/lib/alert-sounds.ts`** -- Add two new sound functions
- `playPackAlertSound()`: Urgent "loud bark" -- two sharp low-frequency bursts (square wave ~200-300Hz) followed by a rising siren sweep, louder master gain (0.5). Distinct from the existing care reminder sounds.
- `playReunitedSound()`: Cheerful chime -- ascending major triad (C5-E5-G5) with a bright sine tone and gentle decay. Warm, celebratory feel.

**5. `src/pages/Social.tsx`** -- Play sounds when alerts render
- Import `playPackAlertSound` from alert-sounds.
- Play `playPackAlertSound()` once when active alert banners first appear (use a ref to avoid replaying on re-renders).

**6. `src/hooks/useLostDogAlerts.tsx`** -- Play reunited sound on resolution
- Import `playReunitedSound` and call it after successful `resolveAlert`.

### Template 3 (Proximity Alert) -- Future
The geo-fenced "Near You" template requires location-based user segmentation in OneSignal (not yet configured). This plan adds a comment in the edge function noting the planned template for when geo-fencing is implemented.

### Summary of notification tone differences

| Event | Title | Body tone | Sound |
|-------|-------|-----------|-------|
| Missing | `🚨 PAWS ALERT: Missing Member!` | Urgent, action-oriented | Sharp bark + siren |
| Reunited | `🎉 Good News: Pack Reunited!` | Celebratory, grateful | Cheerful chime |
| Proximity | `📍 Pack Alert: Near You` | Hyper-local, neighborly | (future) |

