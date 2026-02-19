
## Revert favicon.png Only to Paw_Prin_icon4.png

### What Will Be Done

Only `public/favicon.png` (the browser tab icon) will be overwritten with `user-uploads://Paw_Prin_icon4.png`. All other icons remain untouched.

### Files to Change

| File | Change |
|---|---|
| `public/favicon.png` | Overwrite with `Paw_Prin_icon4.png` (browser tab / Google icon) |
| `public/icon-192.png` | No change — stays as `Paws_Play_Repeat_full_icon_7.png` |
| `public/icon-512.png` | No change — stays as `Paws_Play_Repeat_full_icon_7.png` |
| `public/apple-touch-icon.png` | No change — stays as `Paws_Play_Repeat_full_icon_7.png` |

### Cache Note

After the file is replaced, do a hard refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`) to see the updated favicon in the browser tab.
