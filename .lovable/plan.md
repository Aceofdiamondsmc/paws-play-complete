
# Fix "Add Pack Member" Form Error

## Problem Identified

The "Something went wrong" error occurs because `useDogs.tsx` is trying to insert a field called `energy` into the `dogs` table, but **this column doesn't exist**. The database only has `energy_level`.

**Database schema confirms:**
- `energy_level` ✅ exists
- `energy` ❌ does NOT exist

**Current code in `useDogs.tsx` line 34:**
```typescript
energy: data.energy || 'Medium',        // This will fail!
energy_level: data.energy_level || data.energy || 'Medium',
```

## Solution

### 1. Remove the non-existent `energy` field from the insert operation

**File: `src/hooks/useDogs.tsx`**

Remove line 34 (`energy: data.energy || 'Medium',`) from the `insertData` object, keeping only `energy_level`.

### 2. Update the `DogData` interface to remove `energy`

Remove the obsolete `energy` field from the interface since it's not in the database.

### 3. Improve error messages in `PackMemberForm.tsx`

Update the catch block to display the actual Supabase error message instead of "Something went wrong", making future debugging easier.

## Implementation Details

### File: `src/hooks/useDogs.tsx`

**Changes:**
1. Remove `energy?: string;` from `DogData` interface (line 8)
2. Remove `energy: data.energy || 'Medium',` from `insertData` object (line 34)
3. Simplify `energy_level` assignment to just use `data.energy_level`
4. Remove `energy` handling from `updateDog` function

### File: `src/components/profile/PackMemberForm.tsx`

**Changes:**
1. Remove the `energy` field from `dogData` object in `handleSubmit`
2. Only send `energy_level` (currently passed as `energy_level: energy` from the form state)
3. Update error handling to show actual Supabase error codes

```tsx
// In handleSubmit, change dogData to:
const dogData = {
  name: name.trim(),
  breed: breed.trim(),
  size,
  energy_level: energy,  // Map form state to correct column name
  bio: bio.trim(),
  age_years: ageYears ? parseInt(ageYears) : undefined,
  weight_lbs: weightLbs ? parseFloat(weightLbs) : undefined,
  health_notes: healthInfo.trim(),
  play_style: selectedPlayStyles
};

// In catch block, show detailed error:
} catch (error: any) {
  const errorMessage = error?.message || error?.code || 'Unknown error';
  toast.error(`Failed to save: ${errorMessage}`);
  console.error('Dog save error:', error);
}
```

## Summary

| File | Change |
|------|--------|
| `src/hooks/useDogs.tsx` | Remove non-existent `energy` field from insert/update operations |
| `src/components/profile/PackMemberForm.tsx` | Remove `energy` from data payload, improve error messages |

## Technical Notes

- The `play_style` field is already correctly handled as a `string[]` array
- The `owner_id` is correctly pulled from `user.id` in `useDogs.tsx`
- After this fix, inserts will match the actual database schema exactly
