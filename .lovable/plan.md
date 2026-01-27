

## Fix Dog Profile Edit Form Pre-Population

The edit form appears empty because React's `useState` only initializes values on first render. When the modal opens with different `editingDog` data, the state doesn't update.

---

### Root Cause

```typescript
// Line 65-76 in PackMemberForm.tsx
const [name, setName] = useState(editingDog?.name || '');
const [breed, setBreed] = useState(editingDog?.breed || '');
// etc...
```

The `useState` hook only uses its initial value argument during the component's first mount. If `PackMemberForm` is already mounted (hidden) and `editingDog` changes, the states keep their previous values.

---

### Solution

Add a `useEffect` hook that resets all form state whenever `editingDog` changes. This ensures that:
- When editing a dog, all fields are populated with that dog's data
- When adding a new dog (after editing), fields are cleared
- Play style tags are correctly pre-selected

---

### Changes to PackMemberForm.tsx

Add a `useEffect` after the state declarations (around line 82) to sync form state with `editingDog`:

```typescript
// Reset form when editingDog changes
useEffect(() => {
  setName(editingDog?.name || '');
  setBreed(editingDog?.breed || '');
  setSize(editingDog?.size || 'Medium');
  setEnergy(editingDog?.energy_level || 'Medium');
  setBio(editingDog?.bio || '');
  setAgeYears(editingDog?.age_years?.toString() || '');
  setWeightLbs(editingDog?.weight_lbs?.toString() || '');
  setHealthInfo(editingDog?.health_notes || '');
  setAvatarUrl(editingDog?.avatar_url || '');
  setSelectedPlayStyles(editingDog?.play_style || []);
  // Reset validation state
  setErrors({});
  setTouched({});
}, [editingDog]);
```

---

### Additional Import

Add `useEffect` to the React import:

```typescript
import React, { useState, useRef, useEffect } from 'react';
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/profile/PackMemberForm.tsx` | Add `useEffect` import and form reset effect |

---

### Technical Details

- The `useEffect` dependency array includes `editingDog`, so it runs whenever a different dog is selected for editing
- All form fields are reset: name, breed, size, energy level, bio, age, weight, health notes, avatar URL, and play styles
- Validation state (`errors` and `touched`) is also reset to clear any previous validation errors
- This pattern is commonly called "controlled form synchronization" and ensures the form always reflects the current `editingDog` prop

---

### Expected Behavior After Fix

1. User clicks "Edit" on a dog card
2. `editingDog` is set to that dog's data
3. `useEffect` runs and populates all form fields
4. User sees the form pre-filled with their dog's current information
5. Play style tags that were previously saved appear highlighted/selected

