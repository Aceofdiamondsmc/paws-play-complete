

## Fix: Raise notification badge higher above "Me" icon

The badge currently uses `-top-3` which is only 12px above. Need to push it significantly higher so it fully clears the icon.

### Change — `src/components/layout/BottomNav.tsx`
- **Line 66**: Change `-top-3` to `-top-5` (moves badge ~20px above the icon's top edge, fully clearing it)

One class, one line.

