

## Move "Own a Pet Business" CTA to Top of Explore Page

### Current State
The `AddServiceCTA` component is currently positioned at the bottom of the list view in `src/pages/Explore.tsx`, appearing after all the service cards.

### Proposed Change
Move the `AddServiceCTA` component to appear at the top of the content area, right after the category pills and before the services list/map.

### Implementation

**File: `src/pages/Explore.tsx`**

1. **Remove** the current placement at the bottom (lines 157-160):
   ```tsx
   {/* Add Service CTA */}
   <div className="mt-6">
     <AddServiceCTA />
   </div>
   ```

2. **Add** the component at the top of the content area, right after the category pills section (after line 127):
   ```tsx
   {/* Category Pills */}
   <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
     {/* ... existing pills code ... */}
   </div>

   {/* Add Service CTA - moved to top */}
   <AddServiceCTA />

   {/* Map View */}
   {viewMode === 'map' && (
   ```

This ensures the CTA is visible immediately when users visit the Explore tab, regardless of whether they're in list or map view.

