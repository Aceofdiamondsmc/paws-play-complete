

## Care Schedule UI Fixes

### 1. Header Redesign (line 173-179)
- Increase "Care Schedule" heading from `text-lg` to `text-2xl font-bold`
- Add a subtle accent background strip behind the header area with `bg-primary/10 rounded-xl p-4` styling
- Keep the Heart and Clock icons but bump them to `w-6 h-6`

### 2. Fix Horizontal Scrolling on Quick Log Buttons (lines 440-463)
The Quick Log buttons row uses `flex gap-2` but has no overflow handling, so buttons get squished or hidden on narrow screens.
- Add `overflow-x-auto whitespace-nowrap scrollbar-hide` to the Quick Log button container
- Add `pb-1` for scroll padding so content doesn't feel clipped

### 3. Padding Improvements
- Change the outer Card from `p-4` to `p-5` for more breathing room
- Add `px-1` padding to the scrollable Quick Log row so items don't touch screen edges
- Ensure the Recent Activity section has a small top margin (`mt-2`) for spacing

### Technical Details

**File: `src/components/dates/CareScheduleSection.tsx`**

**Header (line 173-179):**
```tsx
// Change from:
<Card className="p-4 bg-card mt-4">
  <div className="flex items-center gap-2 mb-4">
    <Heart className="w-5 h-5 text-primary" />
    <Clock className="w-5 h-5 text-primary" />
    <h2 className="text-lg font-bold">Care Schedule</h2>
  </div>

// Change to:
<Card className="p-5 bg-card mt-4">
  <div className="flex items-center gap-3 mb-5 bg-primary/10 rounded-xl p-4 -mx-1">
    <Heart className="w-6 h-6 text-primary" />
    <Clock className="w-6 h-6 text-primary" />
    <h2 className="text-2xl font-bold text-primary">Care Schedule</h2>
  </div>
```

**Quick Log scrollable row (line 442):**
```tsx
// Change from:
<div className="flex gap-2">

// Change to:
<div className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide pb-1 px-1">
```

**Recent Activity spacing (line 467):**
```tsx
// Change from:
<div>

// Change to:
<div className="mt-2">
```

### Files Changed
- `src/components/dates/CareScheduleSection.tsx` only

