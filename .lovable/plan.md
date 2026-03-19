

## Add Bi-Annual Expiry + New Vaccination Types

### Changes

**1. `src/hooks/useVetVisits.tsx` — Per-vaccine expiry logic**

Replace the single `VACCINATION_EXPIRY_YEARS = 1` constant with a lookup map. Vaccines like Bordetella and Canine Influenza typically need bi-annual (every 6 months) boosters:

```typescript
const VACCINATION_EXPIRY_MONTHS: Record<string, number> = {
  'Bordetella': 6,
  'Canine Influenza': 6,
  // All others default to 12 months
};
```

In the vaccination loop (line ~74), instead of always adding 1 year, look up the vaccine name — if it's in the map use that month count, otherwise default to 12 months. Use `setMonth()` instead of `setFullYear()`.

**2. `src/components/dates/VetVisitSection.tsx` — Add new vaccines to list + update helper text**

Update `COMMON_VACCINATIONS` array (line 30-37) to add `'Parvovirus'` and `'DA2P'`. Update the helper text from "+1 year expiry" to reflect that some vaccines are 6-month expiry.

**3. `src/components/profile/VaccinationForm.tsx` — Add new vaccine types**

Add `'Parvovirus'` and `'DA2P'` to the `VACCINATION_TYPES` array (line 30-38).

### Files Modified
- `src/hooks/useVetVisits.tsx`
- `src/components/dates/VetVisitSection.tsx`
- `src/components/profile/VaccinationForm.tsx`

