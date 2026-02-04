

## ParkCard Image Enhancement

This plan adds a polished image loading experience with skeleton placeholders and proper error handling, while preserving the existing proximity sorting.

---

### What You'll Get

1. **Skeleton Loading State** - Shows an animated skeleton placeholder while park images load
2. **Error Fallback** - Gracefully falls back to paw-print icon if image fails to load
3. **Proximity Sorting Intact** - No changes needed to sorting logic (already working correctly)

---

### Implementation Details

**Update ParkCard.tsx**

Add state management for image loading and error handling:

```typescript
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const ParkCard = memo(function ParkCard({ park, userLocation }: ParkCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // ... existing distance calculation ...

  const showImage = park.image_url && !imageError;

  return (
    <Card className="p-4 card-playful">
      <div className="flex gap-4">
        {showImage ? (
          <div className="relative w-24 h-24 shrink-0">
            {/* Skeleton shown while loading */}
            {imageLoading && (
              <Skeleton className="absolute inset-0 rounded-xl" />
            )}
            <img
              src={park.image_url}
              alt={park.name || 'Dog Park'}
              className={cn(
                "w-24 h-24 object-cover rounded-xl transition-opacity duration-200",
                imageLoading ? "opacity-0" : "opacity-100"
              )}
              loading="lazy"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
          </div>
        ) : (
          <div className="w-24 h-24 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <PawPrint className="w-8 h-8 text-primary" />
          </div>
        )}
        {/* ... rest of card content unchanged ... */}
      </div>
    </Card>
  );
});
```

---

### Key Changes

| Feature | Implementation |
|---------|---------------|
| **Skeleton placeholder** | Positioned absolutely over the image container, hidden when image loads |
| **Smooth transition** | Image fades in with `transition-opacity duration-200` |
| **Error handling** | `onError` callback sets `imageError` state, triggers fallback |
| **Fallback UI** | Same paw-print icon as before when no image or image fails |

---

### File to Modify

| File | Changes |
|------|---------|
| `src/components/parks/ParkCard.tsx` | Add `useState` for loading/error states, import `Skeleton` and `cn`, wrap image in relative container with skeleton overlay |

---

### Technical Notes

**Why This Approach?**
- **Skeleton overlay**: The skeleton is positioned absolutely on top, so the layout doesn't shift when the image loads
- **Opacity transition**: Creates a smooth fade-in effect rather than a jarring pop
- **Lazy loading preserved**: `loading="lazy"` still works for browser-native lazy loading

**Proximity Sorting Status**
- Already working correctly in `useParksPaginated.tsx`
- The `image_url` field is already being mapped from the database (line 60)
- Distance calculations happen independently of image loading
- No changes needed to the sorting logic

**Image Loading Flow**
```text
┌─────────────────────────────────────────────────┐
│ 1. Component mounts with imageLoading=true     │
│    └─ Skeleton visible, image hidden (opacity-0)│
├─────────────────────────────────────────────────┤
│ 2. Image loads successfully (onLoad fires)      │
│    └─ imageLoading=false, image fades in       │
├─────────────────────────────────────────────────┤
│ 3. Image fails (onError fires)                  │
│    └─ imageError=true, fallback paw icon shown │
└─────────────────────────────────────────────────┘
```

