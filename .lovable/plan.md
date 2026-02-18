

## Add "Processing Image..." Feedback During HEIC Conversion

### Problem
When a user selects a HEIC/HEIF image, the `ensureJpeg` conversion can take a few seconds. During this time there's no visual feedback, making the app appear frozen.

### Solution
Add a toast notification and a processing state at each call site where `ensureJpeg` is invoked during file selection. The toast will appear only for actual HEIC files (non-HEIC files return instantly so no feedback is needed).

### Changes

#### 1. Update `ensureJpeg` to accept an optional `onStart` callback
**File: `src/lib/heic-convert.ts`**
- Add an optional `onProcessing` callback parameter
- Call it right before the conversion begins (only for actual HEIC files)
- This keeps the utility reusable without hardcoding toast logic

```ts
export async function ensureJpeg(
  file: File,
  onProcessing?: () => void
): Promise<File> {
  if (!isHeic(file)) return file;
  onProcessing?.();
  // ... existing conversion logic
}
```

#### 2. Update `CreatePostForm` -- show toast + processing state
**File: `src/components/social/CreatePostForm.tsx`**
- Add a `processing` boolean state
- In `handleImageSelect`, pass an `onProcessing` callback that fires a toast and sets `processing = true`
- After conversion completes, set `processing = false`
- Disable the post button while processing
- Show "Processing..." text on the image button area while converting

#### 3. Update `PhotoUploadSheet` -- show toast during file select
**File: `src/components/social/PhotoUploadSheet.tsx`**
- Add a `processing` boolean state
- In `handleFileSelect`, after detecting a HEIC file, show a toast: "Processing image... Converting for best compatibility"
- Set `processing = true` before conversion, `false` after
- Disable submit and cancel buttons while processing
- Show a small spinner overlay on the image preview area

#### 4. Update `useImageUpload` -- show toast during upload conversion
**File: `src/hooks/useImageUpload.tsx`**
- Pass an `onProcessing` callback when calling `ensureJpeg` that fires a toast notification

### Technical Details

**`src/lib/heic-convert.ts`** -- add callback parameter:
```ts
export async function ensureJpeg(
  file: File,
  onProcessing?: () => void
): Promise<File> {
  if (!isHeic(file)) return file;
  onProcessing?.();
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
  const result = blob instanceof Blob ? blob : blob[0];
  const name = file.name.replace(/\.(heic|heif)$/i, '.jpg');
  return new File([result], name, { type: 'image/jpeg' });
}
```

**`src/components/social/CreatePostForm.tsx`** -- key changes in `handleImageSelect`:
```tsx
const [processing, setProcessing] = useState(false);

const handleImageSelect = async (e) => {
  const rawFile = e.target.files?.[0];
  if (rawFile) {
    try {
      setProcessing(true);
      const file = await ensureJpeg(rawFile, () => {
        toast({
          title: "Processing image... 📸",
          description: "Converting for best compatibility. One moment!",
        });
      });
      setImageFile(file);
      // ... preview logic unchanged
    } catch { ... }
    finally { setProcessing(false); }
  }
};

// Disable post button: 
const isSubmitting = isPosting || uploading || processing;
```

**`src/components/social/PhotoUploadSheet.tsx`** -- key changes in `handleFileSelect`:
```tsx
const [processing, setProcessing] = useState(false);

const handleFileSelect = async (e) => {
  const file = e.target.files?.[0];
  if (file) {
    // ... existing validation ...
    try {
      setProcessing(true);
      const converted = await ensureJpeg(file, () => {
        toast({
          title: "Processing image... 📸",
          description: "Converting for best compatibility. One moment!",
        });
      });
      setImageFile(converted);
      // generate preview from converted file
    } catch { ... }
    finally { setProcessing(false); }
  }
};
// Disable submit while processing
// Show Loader2 spinner overlay when processing is true
```

**`src/hooks/useImageUpload.tsx`** -- add toast on conversion:
```tsx
file = await ensureJpeg(file, () => {
  toast({
    title: "Processing image... 📸",
    description: "Converting for best compatibility.",
  });
});
```

### Files Changed
- `src/lib/heic-convert.ts` -- add optional callback parameter
- `src/hooks/useImageUpload.tsx` -- pass toast callback
- `src/components/social/CreatePostForm.tsx` -- add processing state + toast
- `src/components/social/PhotoUploadSheet.tsx` -- add processing state + toast
