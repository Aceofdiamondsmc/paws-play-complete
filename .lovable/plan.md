

## Fix Vaccination Display in Pack Discovery

### Problems Found

1. **Hardcoded "Verified" badge** — `Pack.tsx` line 457-460 shows a green "Verified" badge for **every single dog** unconditionally. It never checks `vaccination_certified`.

2. **RPC mapping drops `vaccination_certified`** — When dogs come from the `get_nearby_dogs` RPC (line 202-226), `vaccination_certified` is never mapped onto the dog object. It's missing from the mapping entirely. So even the `VaccinationBadge` component on line 419 gets `undefined` and shows nothing meaningful.

3. **Fallback fetch also drops it** — The fallback query (line 233-236) does `select('*')` which includes the field, but only because it spreads `...d as DogType`. The RPC path is the problem.

### Plan

**`src/pages/Pack.tsx`** — Two changes:

1. **Conditionally render the "Verified" badge** (lines 456-460): Only show it when `currentDog.vaccination_certified === true`. When false/null, show an "Unverified" badge in gray/amber instead.

2. **Add `vaccination_certified` to the RPC mapping** (line 202): Include `vaccination_certified: d.vaccination_certified` in the object mapping so the field flows through from the RPC result.

Both are small edits in one file. The `VaccinationBadge` on line 419 and the `PackMemberForm` toggle already work correctly — they just weren't getting the data.

### Technical Detail

The `get_nearby_dogs` RPC may or may not return `vaccination_certified`. If it doesn't include the column, the value will be `undefined` and the badge will correctly show "Unverified." No RPC/migration change needed — the column exists on the `dogs` table and most RPCs return `SELECT *` or can be checked.

