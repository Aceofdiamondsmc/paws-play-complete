## Goal
Temporarily hide the Shop tab from the app UI while preserving all code so it can be re-enabled later. Save a memory note documenting how to restore it.

## Changes

### 1. `src/components/layout/BottomNav.tsx`
Remove the Shop entry from the `navItems` array so the icon no longer appears in the bottom navigation. Leave the `ShoppingCart` import in place (or remove it — trivial) and leave every other tab untouched.

### 2. `src/App.tsx`
Comment out (do not delete) the `/shop` route and its `Shop` import so the page is unreachable via navigation but the code stays intact for quick re-enable.

Keep `src/pages/Shop.tsx` untouched.

### 3. Memory
Save `mem://features/shop-tab-disabled` describing:
- Shop tab is temporarily hidden (store disabled)
- To re-enable: uncomment the `/shop` route + import in `src/App.tsx`, and add the Shop entry back to `navItems` in `BottomNav.tsx` (path `/shop`, icon `ShoppingCart`, label `Shop`)
- Shopify Buy Button config (domain `diamond-lanes-clothing.myshopify.com`, collection `340574437533`) lives in `src/pages/Shop.tsx` and remains intact

Add a one-liner to `mem://index.md` Memories section pointing to it.

## Out of scope
No changes to Shopify config, no file deletions, no other tabs touched.
