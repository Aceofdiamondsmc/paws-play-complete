

## Problem

The Privacy Policy, Terms of Service, and Contact Support links on the Me tab open external URLs (`pawsplayrepeat.app/*.html`) via `target="_blank"`. In a native iOS app (TestFlight), this navigates away from the app with no way to return easily.

## Solution

Replace the external `<a>` links with buttons that open in-app Dialog modals — reusing the same content already defined in `Landing.tsx` for Privacy, TOS, and Support dialogs.

## Changes

### `src/pages/Me.tsx`

1. Add three state variables: `showPrivacy`, `showTos`, `showSupport`
2. Replace the three `<a href="...">` elements with `<button onClick={() => setShowX(true)}>` elements (remove the `ExternalLink` icon, keep `Shield`/`Scale`/`Mail` icons)
3. Add three `<Dialog>` components at the bottom of the JSX — same content as the dialogs already in `Landing.tsx` (Privacy Policy, Terms of Service, Support), each with a close X button built into the `DialogContent` component

The Dialog component from shadcn/ui already includes a close X button in the top-right corner, so no extra work is needed for dismissal.

