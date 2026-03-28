

## Cleanup: Rename Explore → Services in Files and Code

The URL routing is already correct (`/services`), and the redirects from `/explore` are kept as safety nets. This is a pure code/file cleanup to align internal naming with the "Services" branding.

### Changes

**1. Rename file: `src/pages/Explore.tsx` → `src/pages/Services.tsx`**
- Rename the default export function from `Explore` to `Services`

**2. Rename folder: `src/components/explore/` → `src/components/services/`**
- All files inside move with it: `ExploreAssistant.tsx`, `FreeTrialBanner.tsx`, `ServicesMap.tsx`, `ServiceLocationMap.tsx`, `WeatherWidget.tsx`
- Rename `ExploreAssistant.tsx` → `ServicesAssistant.tsx` and update the component name

**3. Update imports in affected files:**

| File | What changes |
|---|---|
| `src/App.tsx` | `import Services from "./pages/Services"` + update route element, keep `ExploreIdRedirect` helper for legacy URLs |
| `src/pages/Services.tsx` (was Explore) | Update all `@/components/explore/...` → `@/components/services/...` |
| `src/pages/ServiceDetails.tsx` | `@/components/explore/ServiceLocationMap` → `@/components/services/ServiceLocationMap` |
| `src/components/services/ServicesAssistant.tsx` | Rename component function |

**4. Update type: `src/types/index.ts`**
- Change `'explore'` to `'services'` in the `TabName` union type

**5. Keep the redirect routes** in `App.tsx` (`/explore` → `/services`) so any old bookmarks or links still work.

No routing, navigation logic, or edge function URLs change. This is purely internal naming alignment.

