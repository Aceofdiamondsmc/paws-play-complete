

## Fix: Notification badge overlapping "Me" icon

From the screenshot, the badge is still overlapping the icon. The badge is positioned `absolute` inside a `relative` container that wraps a 24x24 icon (`w-6 h-6`). `-top-5` is 20px, but the parent `div.relative` only has implicit height from the icon (24px), so the badge still visually overlaps.

The fix: use `-top-7` (28px) to push the badge well above the 24px icon, ensuring full clearance on mobile devices.

### Change -- `src/components/layout/BottomNav.tsx`
- **Line 66**: Change `-top-5` to `-top-7`

One class, one line.

