
Simple addition to `src/lib/countries.ts`. Add Dominica (ISO code `dm`) to the COUNTRIES array, placed near other Caribbean entries (next to Dominican Republic for clarity, but distinct).

### Change
**`src/lib/countries.ts`** — add one entry:
```ts
{ name: 'Dominica', code: 'dm' },
```
Insert it just before `{ name: 'Dominican Republic', code: 'do' }` so the two Caribbean neighbors sit together and the visual difference is obvious to users scrolling the list.

### Effect
- Appears automatically in the `CountryCombobox` (used by `OnboardingProfileSetup` and `SuggestParkModal`) — no other code changes needed.
- ISO `dm` enables Mapbox geocoding bias for Dominica when used.
- Non-US country, so location formatting will display as "City, Region, Dominica" via `formatLocation`.

No version bump or native rebuild needed — pure web data change, picked up on next deploy.
