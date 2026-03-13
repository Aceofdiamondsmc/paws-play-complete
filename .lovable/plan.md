

## Vet Verified (Level 2) Badge Flow

### Overview
Add a 3-tier verification system where uploaded vaccination documents are reviewed by admins, upgrading dogs from "Owner Certified" (amber) to "Vet Verified" (green).

### Tier Display

```text
┌─────────────────────────────────────────────────┐
│  Gray   │ ShieldOff   │ Unverified              │
│  Amber  │ ShieldCheck │ Owner Certified (Level 1)│
│  Green  │ ShieldCheck │ Vet Verified (Level 2)   │
└─────────────────────────────────────────────────┘
```

### Database Changes

1. **Add `vet_verified` column to `dogs` table** — boolean, default `false`. This is the Level 2 flag set by admin after reviewing docs.

2. **Update `get_nearby_dogs` RPC** — include `d.vet_verified` in return type and SELECT.

3. **Update vaccination record status flow** — when a user uploads a doc, set status to `pending_review` instead of `verified`. Admins approve → `vet_verified`. Admins reject → `rejected`.

### Frontend Changes

**`src/hooks/useVaccinations.tsx`**
- Change `addRecord` to set status to `pending_review` when a document is attached (otherwise `verified` for self-report).

**`src/components/profile/VaccinationForm.tsx`**
- Show review status badges on each record: "Pending Review", "Vet Verified", "Rejected".

**`src/pages/Pack.tsx`**
- Add `vet_verified` to `DogWithOwner` interface.
- Update badge logic: `vet_verified` → green "Vet Verified", `vaccination_certified` → amber "Owner Certified", else → gray "Unverified".

**`src/components/profile/VaccinationBadge.tsx`**
- Accept `vetVerified` prop. Show green badge for vet verified, amber for owner certified.

**`src/types/index.ts`**
- Add `vet_verified: boolean | null` to `Dog` interface.

**New: `src/pages/admin/AdminVaccinations.tsx`**
- Admin page listing all `vaccination_records` with `pending_review` status.
- Shows dog name, owner, vaccination type, expiry date, document link (opens in new tab).
- Approve button → sets record status to `vet_verified` + sets `dogs.vet_verified = true`.
- Reject button → sets record status to `rejected`.

**`src/components/admin/AdminLayout.tsx`**
- Add "Vaccinations" nav item linking to `/admin/vaccinations`.

**`src/App.tsx`**
- Add route for `/admin/vaccinations`.

### Files Changed

| File | Change |
|------|--------|
| SQL migration | Add `vet_verified` to dogs, update `get_nearby_dogs` RPC |
| `src/types/index.ts` | Add `vet_verified` to Dog |
| `src/hooks/useVaccinations.tsx` | Status = `pending_review` when doc attached |
| `src/components/profile/VaccinationForm.tsx` | Show review status per record |
| `src/components/profile/VaccinationBadge.tsx` | Support vet_verified prop |
| `src/pages/Pack.tsx` | 3-tier badge display |
| `src/pages/admin/AdminVaccinations.tsx` | New admin review page |
| `src/components/admin/AdminLayout.tsx` | Add nav item |
| `src/App.tsx` | Add admin route |

