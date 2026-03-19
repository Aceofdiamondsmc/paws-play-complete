

## Fix: Flyer Print Blocked by Pop-up Blocker

### Problem
`window.open('', '_blank')` is blocked by pop-up blockers on most browsers and native WebViews because it's not called directly from a user-initiated click event (it's inside async state logic).

### Solution

**File: `src/components/lost-dog/LostDogAlertModal.tsx`**

Replace `window.open` with an **iframe-based** approach:

1. Create a hidden `<iframe>` element, append it to the document body
2. Write the flyer HTML into the iframe's document
3. Call `iframe.contentWindow.print()` to trigger the print dialog
4. Remove the iframe after printing

This avoids pop-up blockers entirely since it doesn't open a new window.

```typescript
const handlePrint = () => {
  if (!selectedDog) return;
  const html = generateFlyerHTML({ ... });

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    // Wait for images (QR code, dog photo) to load before printing
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  }
};
```

Remove the `window.open` fallback and the pop-up error toast. No other files need changes.

