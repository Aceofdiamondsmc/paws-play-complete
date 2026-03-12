

## Vaccination Self-Certification & Legal Disclaimer

The `vaccination_certified` column already exists in the `dogs` table (boolean, default false). No database migration needed.

### Changes

**1. `src/components/profile/PackMemberForm.tsx`**
- Add `vaccination_certified` state (boolean), prepopulated from `editingDog`
- Add a Switch/Checkbox after Health Notes: "I certify that [name || 'my dog'] is up-to-date on all local vaccination requirements (Rabies, DHPP, etc.)"
- Include `vaccination_certified` in the `dogData` object sent to `addDog`/`updateDog`

**2. `src/hooks/useDogs.tsx`**
- Add `vaccination_certified` to the `DogData` interface
- Map it through in `addDog` and `updateDog`

**3. `src/types/index.ts`**
- Add `vaccination_certified: boolean | null` to the `Dog` interface

**4. `src/components/profile/HelpSupport.tsx`**
- Add a new accordion item with a Scale/Shield icon: "Release of Liability"
- Content: legal disclaimer text about users being responsible for verifying health and temperament of dogs they interact with

**5. Badge display — new component `src/components/profile/VaccinationBadge.tsx`**
- Small inline component: if `vaccination_certified === true`, render a green ShieldCheck icon with tooltip "Owner Certified Vaccinated"
- If false/null, render nothing (or a subtle gray shield if desired)

**6. Show badge in dog cards**
- Search for where dog profiles/cards are rendered (Pack tab, playdate cards, etc.) and add the `VaccinationBadge` next to the dog name

### Files
| File | Change |
|------|--------|
| `src/hooks/useDogs.tsx` | Add `vaccination_certified` to interface and CRUD |
| `src/types/index.ts` | Add field to `Dog` type |
| `src/components/profile/PackMemberForm.tsx` | Add certification toggle |
| `src/components/profile/HelpSupport.tsx` | Add liability disclaimer accordion |
| `src/components/profile/VaccinationBadge.tsx` | New badge component |
| Dog card/profile views | Show badge inline |

