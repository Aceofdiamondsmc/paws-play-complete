
## Plan: Fix the phone flyer image issue at the real root

### What I found

The main reason this is still failing on your phone is:

- the app tries to convert the dog photo to base64 first
- but if that conversion fails on iPhone/Safari/WebKit, the **native flyer path falls back to the original remote `avatar_url`**
- that fallback is exactly the kind of image source that often renders as a **blank box** in print/share capture on mobile

I confirmed that in `LostDogAlertModal.tsx` the offscreen native flyer still does this:

```text
avatarUrl={preparedAvatar || selectedDog.avatar_url}
```

So even after the “hardening,” the native share/print path can still reuse the original remote Supabase image URL and reintroduce the same failure.

### Why one Google-image account works

That part makes sense based on the code and the behavior:

- Google/other external images may already be:
  - smaller
  - cached
  - easier for iPhone WebKit to decode
  - delivered with headers Safari happens to tolerate better in this flow
- your Supabase dog avatar images are public, but **public does not guarantee they can be safely re-rendered inside canvas / html-to-image / iOS print capture**
- so one image source can “randomly” work while another becomes a blank rectangle

In short:

```text
Same flyer code
Different image host / file / caching behavior
=> one works, one prints blank
```

### Also found an upload-related gap

Dog avatar uploads are converted to JPEG only for HEIC files.

That means many dog photos can still be:
- very large
- progressive JPEGs
- PNGs with odd metadata
- formats iPhone preview displays fine but print/share capture fails on

So the flyer path is being asked to rescue files that were never normalized strongly enough for print capture.

### What I would change

#### 1. Remove the native fallback to remote avatar URLs
In `src/components/lost-dog/LostDogAlertModal.tsx`:
- stop passing `selectedDog.avatar_url` into the offscreen flyer
- use only the prepared image result
- if preparation fails, show the placeholder intentionally

This is the most important fix.

#### 2. Prepare flyer image from the actual source file earlier and more reliably
Still in `LostDogAlertModal.tsx`:
- improve the image prep step so it is more tolerant on iPhone:
  - use `img.decode()` when available
  - wait for image readiness before drawing
  - preserve aspect ratio cleanly
  - add stronger logging branches for:
    - load fail
    - canvas export fail
    - tainted canvas fail
- if prep fails, do **not** silently fall back to remote URL for native rendering

#### 3. Normalize dog avatar uploads more aggressively
In `src/hooks/useDogs.tsx`:
- convert **all dog avatar uploads** to a print-safe JPEG, not only HEIC
- resize large uploads on upload
- strip problematic metadata by re-encoding through canvas before storage

This prevents future flyer failures instead of only trying to patch them later.

#### 4. Keep placeholder behavior explicit
In `src/components/lost-dog/FlyerTemplate.tsx`:
- keep the visible placeholder block
- make sure the native flyer always shows:
  - actual prepared image, or
  - clear placeholder
- never a broken `<img>` that becomes a blank box

### Files to update

| File | Change |
|------|--------|
| `src/components/lost-dog/LostDogAlertModal.tsx` | Remove native fallback to raw avatar URL; only use prepared flyer image or placeholder |
| `src/hooks/useDogs.tsx` | Re-encode all dog avatar uploads to print-safe JPEG and resize before upload |
| `src/lib/heic-convert.ts` or new shared image util | Add reusable “normalize image to JPEG” helper for uploads and flyer prep |
| `src/components/lost-dog/FlyerTemplate.tsx` | Keep placeholder-only fallback and avoid broken image rendering |

### Expected result

After this fix:
- iPhone flyer printing will no longer depend on whether the raw remote image URL happens to work
- dogs whose image prep fails will show a clear placeholder instead of a blank box
- newly uploaded dog photos will be much more reliable in the flyer flow

### Why this matches your symptom exactly

```text
Why only one account works?
Because that account's image source/file happens to survive iPhone print rendering.

Why do the others fail?
Because the native flyer still falls back to remote avatar URLs when base64 prep fails,
and iPhone print/share capture is fragile with those URLs.
```

### Recommended implementation priority

1. Remove `preparedAvatar || selectedDog.avatar_url` fallback
2. Force placeholder when prep fails
3. Normalize all future avatar uploads to print-safe JPEG
4. Optionally add a one-time “re-save dog photo” path for existing dogs whose stored image is problematic

### Technical details

```text
Current native path:
prepare avatar -> if fail -> use raw selectedDog.avatar_url -> html-to-image capture -> blank box on iPhone

Correct native path:
prepare avatar -> if success use preparedAvatar
prepare avatar -> if fail use placeholder
never pass raw remote avatar URL into the native flyer capture
```

<lov-actions>
<lov-suggestion message="Test the lost dog flyer end-to-end on your iPhone after removing the raw avatar fallback and verify whether the placeholder or real image appears consistently">Test flyer end-to-end</lov-suggestion>
<lov-suggestion message="Implement the flyer fix by removing the native fallback to selectedDog.avatar_url and forcing a placeholder when image preparation fails">Remove raw avatar fallback</lov-suggestion>
<lov-suggestion message="Normalize all dog avatar uploads by re-encoding every uploaded image to a resized JPEG before saving to Supabase Storage">Harden avatar uploads</lov-suggestion>
<lov-suggestion message="Add debug toasts or logging around flyer image preparation so we can tell whether the failure is image load, canvas export, or html-to-image capture on iPhone">Add flyer debug logging</lov-suggestion>
</lov-actions>
