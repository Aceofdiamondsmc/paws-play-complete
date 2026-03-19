

## Messaging Upgrade: Photo Attachment + Premium UX Polish

### 1. Database: Add `image_url` column to `messages`

```sql
ALTER TABLE public.messages ADD COLUMN image_url text;
```

No RLS changes needed — existing policies already cover the messages table.

### 2. Photo/File Attachment in ChatView — Single Button

Add a **paperclip/plus button** to the left of the text input. Tapping it opens a native file picker accepting images (jpeg, png, gif, webp, heic, heif). No separate camera/gallery/file buttons — one unified `<input type="file">` behind one icon button.

Flow:
- User taps the attachment icon → file picker opens
- Selected image shows as a thumbnail preview above the input bar (with an X to remove)
- HEIC files auto-convert via existing `ensureJpeg()` utility
- On send: upload to `post-images` bucket under `{userId}/chat_{timestamp}.jpg`, get public URL, insert message with `image_url` and optional text `content`
- If only an image (no text), set `content` to `📷`

### 3. Render Image Messages in Chat Bubbles

In the message rendering loop, check for `image_url`:
- If present, render a rounded image thumbnail (max-height ~200px, `object-cover`) inside the bubble, above the text
- Tap on image opens a full-screen lightbox overlay (dark backdrop, centered image, tap-to-close)
- Text appears below the image if both exist

### 4. UX & Visual Polish for Chat — "Make It Feel Premium"

**Message Bubbles:**
- Increase text size from `text-sm` to `text-[15px]` with `leading-relaxed` for readability
- Own messages: richer gradient background (`bg-gradient-to-br from-primary to-primary/90`) with a subtle shadow
- Other messages: slightly elevated with `shadow-sm` and a warmer background (`bg-card` instead of `bg-muted`)
- Add `font-medium` to message text for better weight/visibility
- Emoji-only messages (1-3 chars, all emoji): render at `text-3xl` with no bubble background — just the emoji floating

**Timestamps:**
- Slightly more contrast: `text-primary-foreground/80` for own, `text-muted-foreground/80` for others

**Header:**
- Add an online-style status dot on the avatar (decorative, always green for now — gives life)
- Slightly larger display name with `text-lg font-bold`

**Input Bar:**
- Taller input with `py-3` and `text-[15px]`
- Warmer border styling: `border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary/30`
- Send button: gradient background matching primary, slight scale animation on press (`active:scale-90`)
- Attachment button: subtle muted style, transitions to primary color on hover

**Empty State:**
- Replace plain text with a friendly paw emoji illustration, warmer copy, and a subtle animation

**Message List (conversation list on Me tab):**
- Bolder unread conversation names with `font-bold` instead of `font-semibold`
- Last message preview slightly larger
- Add a subtle left border accent on unread conversations

### 5. Update Message Type

Add `image_url?: string | null` to the `Message` interface in `src/types/index.ts`.

### Files Modified
- `src/components/profile/ChatView.tsx` — attachment button, image rendering, lightbox, full visual overhaul
- `src/hooks/useMessages.tsx` — `sendMessage` accepts optional `imageUrl` parameter
- `src/types/index.ts` — add `image_url` to `Message`
- `src/components/profile/MessageList.tsx` — visual polish for conversation list
- New migration SQL for the `image_url` column

