

## Fix: Raise notification badge above "Me" tab icon

The red unread-count badge on the "Me" tab uses `absolute -top-1.5 -right-1.5` (line 66 in `BottomNav.tsx`), which places it overlapping the icon. Raising it slightly so it sits clearly above the icon.

### Change — `src/components/layout/BottomNav.tsx`
- **Line 66**: Change `-top-1.5` to `-top-3` (moves the badge ~6px higher, clearing the icon)

One class change, one line, one file.

