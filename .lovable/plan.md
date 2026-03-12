

## Pack Alert System Enhancements

Six interconnected features for the lost dog alert system. The current "SOSCard" is the `PackAlertBanners` component inline in `Social.tsx`, and alert creation lives in `LostDogAlertModal.tsx`.

---

### 1. Database: Add `reward` column

**Migration**: Add nullable `reward` text column to `lost_dog_alerts` table.

```sql
ALTER TABLE lost_dog_alerts ADD COLUMN reward text;
```

No RLS changes needed (existing policies cover it).

---

### 2. Reward field in creation form (`LostDogAlertModal.tsx`)

- Add `reward` state field
- Add optional "Reward" input (with Gift icon) in Step 2 (Description & Contact step)
- Pass `reward` through to `createAlert`
- Update `useLostDogAlerts.tsx` `createAlert` to accept and insert `reward`
- Update the auto-generated Social post text to include reward info when present
- Display reward in Step 3 review panel

---

### 3. Share button on Pack Alert banner (`Social.tsx`)

- Add a `Share` icon button next to the existing "Found" button on each alert in `PackAlertBanners`
- Use Web Share API (`navigator.share`) with fallback to clipboard copy
- Share text: `🚨 PAWS ALERT: [Dog Name] is missing! [Reward offered for safe return. ]Help the pack find them. View details here: [URL]`
- URL points to the app's social page

---

### 4. Reward display on Pack Alert banner (`Social.tsx`)

- In `PackAlertBanners`, check `alert.reward` and display a Gift icon + "Reward Offered" badge when present
- Fetch reward data: update `useLostDogAlerts` to include `reward` in the select query (already selects `*`, so no change needed)
- Update `LostDogAlert` interface to include `reward`

---

### 5. Success Modal with checklist (`LostDogAlertModal.tsx`)

After successful submission, instead of closing + toast:
- Show a new step (step 4) as a success screen inside the same dialog
- Header: "Pack Alert Broadcasted!"
- Subtext about next steps
- Interactive checklist (4 items with checkboxes, local state)
- "Download Flyer" button (triggers print)
- "Got it, let's find [Dog Name]!" button closes modal

---

### 6. Print Flyer with QR code

New component: `src/components/lost-dog/FlyerTemplate.tsx`
- Hidden div rendered when success modal is open, shown only via `@media print` or rendered for `window.print()`
- Letter-sized layout (8.5 x 11) with:
  - Large "MISSING DOG" header
  - Dog photo (large, centered)
  - Dog name, breed, last seen location
  - Reward amount in high-contrast box (if applicable)
  - Contact phone in huge font
  - QR code via Google Chart API: `https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=${encodeURIComponent(url)}`
  - Label: "SCAN FOR MORE PHOTOS & LIVE UPDATES"
- "Download Flyer" button calls `window.print()`
- Add `@media print` CSS in `index.css` to hide everything except the flyer

---

### Files to create/edit

| File | Action |
|------|--------|
| `lost_dog_alerts` table | Migration: add `reward` column |
| `src/hooks/useLostDogAlerts.tsx` | Add `reward` to interface, createAlert params, and insert |
| `src/components/lost-dog/LostDogAlertModal.tsx` | Add reward field, success modal step, print button |
| `src/components/lost-dog/FlyerTemplate.tsx` | **New** — print-optimized flyer with QR code |
| `src/pages/Social.tsx` | Add Share button + reward badge to PackAlertBanners |
| `src/index.css` | Add `@media print` rules to hide non-flyer content |

