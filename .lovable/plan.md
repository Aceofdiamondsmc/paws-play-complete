

## Update Pack Tab with User's Dog First and Paw Placeholder Fallbacks

This plan updates the Pack tab to display the current user's dog as the first card in the discovery stack and adds themed Paw icon fallbacks for missing images.

---

### Summary of Changes

| Change | Description |
|--------|-------------|
| 1 | Remove client-side filtering that excludes user's own dogs (trust the updated RPC ordering) |
| 2 | Import `PawPrint` icon from lucide-react for image fallbacks |
| 3 | Update dog avatar to use `PawPrint` fallback instead of text initial |
| 4 | Update owner avatar to use `PawPrint` fallback when image unavailable |
| 5 | Add `onError` handler to gracefully handle failed image loads |

---

### Implementation Details

#### 1. Update Imports (Line 2)

Add `PawPrint` to the lucide-react imports:

```typescript
import { 
  ChevronRight, ChevronLeft, Zap, Star, Heart, Shield, 
  CheckCircle, Ruler, Dog as DogIcon, MapPin, PawPrint 
} from 'lucide-react';
```

#### 2. Remove User's Own Dog Filtering (Lines 204-206)

The current code filters out the user's own dogs in the fallback path. Since the RPC now includes the user's dog at the top, we should trust that ordering and not filter:

**Current code:**
```typescript
// Filter out current user's dogs
const filteredDogs = user ? dogs.filter(d => d.owner_id !== user.id) : dogs;
```

**Updated code:**
```typescript
// RPC now includes user's dog first - no filtering needed
const filteredDogs = dogs;
```

#### 3. Update Dog Avatar with PawPrint Fallback (Lines 352-357)

Replace the text-based fallback with a themed PawPrint icon:

**Current code:**
```tsx
<Avatar className="w-36 h-36 border-4 border-white shadow-xl">
  <AvatarImage src={currentDog.avatar_url || undefined} className="object-cover" />
  <AvatarFallback className="bg-gray-600 text-5xl text-white">
    {currentDog.name?.[0] || 'D'}
  </AvatarFallback>
</Avatar>
```

**Updated code:**
```tsx
<Avatar className="w-36 h-36 border-4 border-white shadow-xl">
  <AvatarImage src={currentDog.avatar_url || undefined} className="object-cover" />
  <AvatarFallback className="bg-[#7CB69D]/30">
    <PawPrint className="w-16 h-16 text-white/80" />
  </AvatarFallback>
</Avatar>
```

#### 4. Update Owner Avatar with PawPrint Fallback (Lines 527-532 and 550-551)

Update both owner avatar sections to use PawPrint fallback:

**Current code:**
```tsx
<Avatar className="w-12 h-12 border-2 border-[#4ade80]/30">
  <AvatarImage src={currentDog.owner.avatar_url || undefined} />
  <AvatarFallback className="bg-[#4ade80] text-white font-bold">
    {currentDog.owner.display_name?.[0] || 'S'}
  </AvatarFallback>
</Avatar>
```

**Updated code:**
```tsx
<Avatar className="w-12 h-12 border-2 border-[#4ade80]/30">
  <AvatarImage src={currentDog.owner.avatar_url || undefined} />
  <AvatarFallback className="bg-[#4ade80]/20">
    <PawPrint className="w-6 h-6 text-[#4ade80]" />
  </AvatarFallback>
</Avatar>
```

---

### Visual Flow

```text
+------------------+     +-------------------+     +------------------+
|  RPC Returns:    | --> |  Pack.tsx Maps:   | --> |  Card Displays:  |
|  1. User's dog   |     |  Full list with   |     |  1. "My Pack"    |
|  2. Nearby dogs  |     |  owner avatars    |     |  2. Others...    |
|  (sorted)        |     |  from RPC data    |     |                  |
+------------------+     +-------------------+     +------------------+
                                  |
                                  v
                       +---------------------+
                       |  Image Missing?     |
                       |  Show PawPrint icon |
                       +---------------------+
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Pack.tsx` | Add PawPrint import, remove own-dog filtering, update avatar fallbacks |

---

### Technical Notes

- The `PawPrint` icon is already used in `src/pages/Social.tsx`, so this follows existing patterns
- The `AvatarFallback` component from Radix UI automatically displays when the `AvatarImage` fails to load or has no `src`
- The themed colors (`#7CB69D` for dog avatar, `#4ade80` for owner avatar) match the existing Pack tab design system
- Since the RPC now handles ordering with user's dog first, no additional sorting is needed client-side

