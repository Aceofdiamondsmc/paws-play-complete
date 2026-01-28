

## Populate Service Images for Authenticity

The issue is that many services have broken or generic stock image URLs. There are two main problems:

1. **~25 services use generic Unsplash stock photos** (same image for all services in a category)
2. **Many "custom" URLs point to non-existent domains** (e.g., `petworks.com/millennial-logo.png`)

Here's a solution to give each service a unique, professional-looking image that matches its category.

---

### Solution: AI-Generated Service Images

Create an Edge Function that uses Lovable's AI image generation (Gemini) to create unique, high-quality images for each service, then uploads them to Supabase Storage.

---

### Architecture

```text
┌─────────────────────┐
│  Admin Dashboard    │
│  [Generate Images]  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  Edge Function: generate-service-   │
│  images                             │
│  ─────────────────────────────────  │
│  1. Fetch services missing images   │
│  2. Generate prompt per category    │
│  3. Call Gemini image generation    │
│  4. Upload to Supabase Storage      │
│  5. Update service.image_url        │
└─────────────────────────────────────┘
          │
          ▼
┌─────────────────────────┐
│  Supabase Storage       │
│  Bucket: service-images │
└─────────────────────────┘
```

---

### Implementation Steps

#### Step 1: Create Storage Bucket

Create a `service-images` public bucket to store the generated images.

**Migration SQL:**
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true);

-- Allow public read access
CREATE POLICY "service_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');

-- Allow service role to upload
CREATE POLICY "service_images_service_write"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'service-images');
```

---

#### Step 2: Create Edge Function

**File:** `supabase/functions/generate-service-images/index.ts`

**Functionality:**
- Accept `action`: `process_single` (one service) or `process_batch` (multiple services)
- Generate category-specific prompts for realistic pet service imagery
- Call Lovable AI Gateway with Gemini image model
- Upload resulting base64 image to Supabase Storage
- Update the service record with the new `image_url`

**Category Prompts:**
```typescript
const CATEGORY_PROMPTS: Record<string, string> = {
  'Dog Walkers': 'Professional photo of a friendly person walking multiple happy dogs on leashes in a sunny park, warm natural lighting, authentic candid style',
  'Groomers': 'Professional pet grooming salon interior, clean and modern, showing a well-groomed fluffy dog on grooming table, spa-like atmosphere',
  'Vet Clinics': 'Modern veterinary clinic reception area, warm and welcoming, with a friendly veterinarian in scrubs petting a calm dog, professional medical setting',
  'Trainers': 'Outdoor dog training session, professional trainer working with an attentive dog, positive reinforcement training, natural park setting',
  'Daycare': 'Bright colorful dog daycare facility with multiple happy dogs playing together, indoor play area, joyful atmosphere',
  // ... more categories
};
```

**Key Code Pattern:**
```typescript
const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-2.5-flash-image",
    messages: [{ role: "user", content: prompt }],
    modalities: ["image", "text"]
  })
});

const data = await response.json();
const base64Image = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

// Upload to storage and get public URL
const { data: uploadData } = await supabase.storage
  .from('service-images')
  .upload(`${serviceId}.png`, imageBuffer, { contentType: 'image/png' });
```

---

#### Step 3: Add Admin UI Button

**File:** `src/pages/admin/AdminServices.tsx`

Add a "Generate Images" button in the admin services panel that:
- Identifies services with missing/broken images
- Triggers the edge function in batch mode
- Shows progress as images are generated
- Displays success/error feedback

---

#### Step 4: Add Image Validation

**File:** `src/hooks/useServices.tsx`

Enhance `getServiceImage()` to:
- Validate URLs before using them (check for common broken patterns)
- Prioritize Supabase Storage URLs
- Fall back gracefully to category-based stock photos

---

### Benefits

| Aspect | Before | After |
|--------|--------|-------|
| Image diversity | Same stock photo for entire category | Unique image per service |
| Broken links | Many 404 errors from fake domains | All images hosted on Supabase |
| Authenticity | Generic stock photos | Category-specific professional imagery |
| Load time | External domain dependencies | Fast CDN-backed Supabase Storage |

---

### Files to Create/Modify

1. **Database migration** - Create `service-images` storage bucket
2. **`supabase/functions/generate-service-images/index.ts`** - New edge function
3. **`src/pages/admin/AdminServices.tsx`** - Add "Generate Images" button
4. **`src/hooks/useServices.tsx`** - Improve image fallback logic

---

### Alternative: Quick Fix with Curated Stock Photos

If you prefer not to use AI generation, I can instead:
- Create a curated set of ~20 high-quality Unsplash images per category
- Update the database to randomly assign these to services
- This gives variety without AI generation costs

Would you prefer the AI-generated approach or the curated stock photo approach?

