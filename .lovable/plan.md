

## Fix: Dog photo missing from flyer + enlarge photo

### Changes

**1. Fix image conversion — `src/components/lost-dog/LostDogAlertModal.tsx`**

Replace the `toDataUrl` function (lines 87-96) with a canvas-based approach that reliably produces base64 even with cross-origin images:

```typescript
const toDataUrl = (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      if (!ctx) return reject(new Error('No canvas context'));
      ctx.drawImage(img, 0, 0);
      resolve(c.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
```

**2. Enlarge photo on flyer — `src/components/lost-dog/FlyerTemplate.tsx`**

- **React component** (line ~31): Change `w-72 h-72` (288px) to `w-96 h-96` (384px)
- **Print HTML** (line ~90): Change `width:288px;height:288px` to `width:384px;height:384px`

This makes the dog photo ~33% larger — prominent enough to be recognized from a distance while still fitting the letter-sized layout.

