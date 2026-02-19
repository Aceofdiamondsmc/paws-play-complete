
## Fix Social Share Link Previews on Twitter/X

### Problem
When you share a post to Twitter/X, it shows a generic placeholder image and no post-specific content. This is because the app is a single-page app (SPA) -- Twitter's crawler cannot run JavaScript, so it only sees the static Open Graph tags in `index.html` which point to the generic `/og-image.png`.

### Solution
Create a Supabase Edge Function that serves dynamic HTML with proper Open Graph meta tags when a social media crawler visits a post-specific URL. Regular users get redirected to the app.

### How It Works

1. **Post-specific share URLs**: Change the share URL from `/social` to a post-specific URL like `/social/post/{postId}`
2. **Edge function** (`og-post`): When a crawler (Twitter, Facebook, etc.) hits this URL, the edge function fetches the post from the database and returns an HTML page with dynamic OG tags (title, description, image). For regular browsers, it redirects to the app.
3. **App routing**: Add a `/social/post/:id` route that scrolls/highlights the relevant post or just shows the social feed.

### Changes

#### 1. New Edge Function: `supabase/functions/og-post/index.ts`
- Accepts a `postId` query parameter
- Fetches the post from the `posts` table (content, image_url, author_display_name, pup_name)
- Returns HTML with dynamic OG meta tags:
  - `og:title` -- "{Author Name} on Paws Play Repeat"
  - `og:description` -- The post content (truncated to 200 chars)
  - `og:image` -- The post's image URL (falls back to `/og-image.png`)
  - `twitter:card` -- `summary_large_image`
- Includes a JavaScript redirect to the actual app page for real users
- Also includes a `<meta http-equiv="refresh">` fallback redirect

#### 2. Update share handler in `src/pages/Social.tsx`
- Change the share URL from `${window.location.origin}/social` to the edge function URL with the post ID
- Format: `https://{supabase-url}/functions/v1/og-post?postId={postId}`

#### 3. Add `/social/post/:id` route in `src/App.tsx`
- Points to the same `Social` component (the feed)
- This is the redirect target from the edge function, so users land on the social feed

### Files Changed
- **New**: `supabase/functions/og-post/index.ts` -- Dynamic OG tag server
- **Edit**: `src/pages/Social.tsx` -- Update `handleShare` to use post-specific edge function URL
- **Edit**: `src/App.tsx` -- Add `/social/post/:id` route

### Technical Details

**Edge function logic (simplified)**:
```
1. Extract postId from query params
2. Fetch post from 'posts' table
3. Look up author name (author_display_name or from public_profiles)
4. Return HTML with:
   - OG meta tags (title, description, image)
   - Twitter card meta tags
   - JavaScript redirect: window.location.replace('/social')
   - Meta refresh redirect as fallback
```

**Share URL change**:
```ts
// Before
const shareUrl = `${window.location.origin}/social`;

// After  
const shareUrl = `https://xasbgkggwnkvrceziaix.supabase.co/functions/v1/og-post?postId=${postId}`;
```

**Why an edge function?** Twitter/X crawlers don't execute JavaScript, so we need a server-side endpoint that returns proper HTML with OG tags. The edge function reads the post data from the database and generates the appropriate meta tags on the fly.
