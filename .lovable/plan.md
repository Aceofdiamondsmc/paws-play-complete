

## Fix Badge Labels + Add Tiered Disclosure Visual System

### Problem
The current discovery card shows "Verified" for self-certified dogs, but this conflicts with the tiered model where "Verified" should mean vet-doc-reviewed. Everything else (toggle, badge, liability disclaimer) already exists.

### Changes

**`src/pages/Pack.tsx`** — Update the vaccination status badge section (lines 494-512):
- If `vaccination_certified === true`: Show 🟡 **"Owner Certified"** badge (yellow/amber styling) instead of green "Verified"
- If `vaccination_certified === false/null`: Show ⚪ **"Unverified"** badge (gray, as-is)
- Future-proof: add a placeholder check for a `vaccination_verified` field (Level 2) that would show 🟢 **"Vet Verified"** in green

**`src/components/profile/VaccinationBadge.tsx`** — Update tooltip text:
- Change from "Owner Certified Vaccinated" to "Owner Certified" for clarity
- Keep the green ShieldCheck icon (it's small and used inline with the name)

### Badge Color Mapping

| State | Label | Colors | Icon |
|-------|-------|--------|------|
| Vet Verified (future) | Vet Verified | Green `#4ade80` | CheckCircle |
| Self-Certified | Owner Certified | Amber `#f59e0b` | ShieldCheck |
| None | Unverified | Gray muted | — (text only) |

### Files Changed

| File | Change |
|------|--------|
| `src/pages/Pack.tsx` | Update badge label from "Verified" to "Owner Certified" with amber styling |
| `src/components/profile/VaccinationBadge.tsx` | Update tooltip to "Owner Certified" |

