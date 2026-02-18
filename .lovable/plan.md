

## HEIC Image Support and Image Loading Fallback

### Problem
iPhone users uploading HEIC/HEIF photos see broken images (question marks) on the Social feed because browsers don't natively support this format. Additionally, there's no loading state while images fetch.

### Solution

#### 1. Install `heic2any` library
Add the `heic2any` package which converts HEIC/HEIF blobs to JPEG in the browser.

#### 2. Create a shared HEIC conversion utility
**New file: `src/lib/heic-convert.ts`**
- Export an `ensureJpeg(file: File): Promise<File>` function
- Detect HEIC/HEIF by checking `file.type` (`image/heic`, `image/heif`) and file extension (`.heic`, `.heif`)
- If detected, use `heic2any` to convert to JPEG blob, then wrap it as a new `File` with a `.jpg` extension
- If not HEIC, return the original file unchanged

#### 3. Update `useImageUpload` hook
**File: `src/hooks/useImageUpload.tsx`**
- Import `ensureJpeg` from the utility
- Before uploading, run `file = await ensureJpeg(file)`
- Force the file extension to `.jpg` after conversion (already handled by the utility returning a renamed File)

#### 4. Update `PhotoUploadSheet` upload flow
**File: `src/components/social/PhotoUploadSheet.tsx`**
- In `handleFileSelect`: expand the type check to also accept `image/heic` and `image/heif`
- In `handleSubmit`: before uploading, convert with `ensureJpeg(imageFile)` and re-generate the preview from the converted file
- Update the `accept` attribute on file inputs to include `.heic,.heif`

#### 5. Update `CreatePostForm` upload flow
**File: `src/components/social/CreatePostForm.tsx`**
- In `handleImageSelect`: accept HEIC types, convert with `ensureJpeg`, then generate preview from the converted file
- Update file input `accept` to include `.heic,.heif`

#### 6. Add image loading/fallback state in Social feed
**File: `src/pages/Social.tsx`**
- Replace the plain `<img>` tag (lines 366-370) with a small wrapper component that:
  - Shows a `Skeleton` placeholder while the image is loading (`onLoad` / `onError` handlers)
  - On error, shows a muted fallback icon (e.g., `ImageOff`) instead of a broken image
  - Uses React `useState` to track `loaded` and `errored` states

### Technical Details

**`src/lib/heic-convert.ts`**
```ts
import heic2any from 'heic2any';

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  const ext = file.name.split('.').pop()?.toLowerCase();
  return type === 'image/heic' || type === 'image/heif' 
    || ext === 'heic' || ext === 'heif';
}

export async function ensureJpeg(file: File): Promise<File> {
  if (!isHeic(file)) return file;
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
  const result = blob instanceof Blob ? blob : blob[0];
  const name = file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');
  return new File([result], name, { type: 'image/jpeg' });
}
```

**Social feed image with loading state (in Social.tsx):**
```tsx
// Inline or extracted component
function PostImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <>
      {!loaded && !errored && <Skeleton className="absolute inset-0" />}
      {errored ? (
        <div className="flex items-center justify-center w-full h-full bg-muted">
          <ImageOff className="w-10 h-10 text-muted-foreground" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={cn("object-cover w-full h-full", !loaded && "opacity-0")}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}
    </>
  );
}
```

### Files Changed
- **New**: `src/lib/heic-convert.ts`
- **Modified**: `src/hooks/useImageUpload.tsx`
- **Modified**: `src/components/social/PhotoUploadSheet.tsx`
- **Modified**: `src/components/social/CreatePostForm.tsx`
- **Modified**: `src/pages/Social.tsx`
- **New dependency**: `heic2any`
