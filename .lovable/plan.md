

## Problem

`uploadDogAvatar` in `src/hooks/useDogs.tsx` uploads the file as-is — no HEIC-to-JPEG conversion. The flyer works for dogs with JPEG avatars but fails for dogs with HEIC/PNG/WEBP avatars that iOS WebKit may struggle to render in a print context.

## Plan

### 1. Add `ensureJpeg` to dog avatar uploads (`src/hooks/useDogs.tsx`)

In `uploadDogAvatar` (~line 120), convert the file before uploading:

```typescript
import { ensureJpeg } from '@/lib/heic-convert';
import { toast } from '@/hooks/use-toast';

// Inside uploadDogAvatar, before line 124:
file = await ensureJpeg(file, () => {
  toast({ title: "Processing image... 📸", description: "Converting for best compatibility." });
});
```

This ensures every dog avatar stored in Supabase is a JPEG, matching the pattern already used in `useImageUpload`, `CreatePostForm`, `PhotoUploadSheet`, and `ChatView`.

### 2. No other changes needed

The flyer template and print logic are already correct. This single change ensures all future dog avatars are JPEG-compatible. Existing non-JPEG avatars from before this fix would need to be re-uploaded by the user.

