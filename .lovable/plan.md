

## Two Small Fixes on Dates Page Preview Cards

### 1. Left card: Change dog icon to full-body dog icon + yellow color (`src/pages/Dates.tsx`, line 115)

Lucide's `Dog` icon shows the full dog body. The original "Breakfast" color was `text-amber-300`. Change from `text-blue-300` to `text-amber-300`.

```tsx
// Line 115: change text-blue-300 → text-amber-300
<Dog className="w-3.5 h-3.5 text-amber-300 shrink-0" />
```

### 2. Right card: Raise to match left card height (`src/pages/Dates.tsx`, line 139)

Left card is `top-6`. Right card is `top-16`. Change right card to `top-6` so they appear at even height.

```tsx
// Line 139: change top-16 → top-6
className="absolute top-6 right-4 w-44 ..."
```

No other changes.

