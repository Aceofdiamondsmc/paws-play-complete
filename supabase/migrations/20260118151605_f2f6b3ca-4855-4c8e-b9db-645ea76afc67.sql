-- Add columns to post_images to support social feed functionality
ALTER TABLE public.post_images 
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS caption TEXT,
ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Enable Row Level Security
ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

-- Create policies for post_images
CREATE POLICY "post_images_public_read"
ON public.post_images
FOR SELECT
USING (visibility = 'public' OR user_id = auth.uid());

CREATE POLICY "post_images_author_insert"
ON public.post_images
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_images_author_update"
ON public.post_images
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_images_author_delete"
ON public.post_images
FOR DELETE
USING (auth.uid() = user_id);

-- Create likes table for post_images
CREATE TABLE IF NOT EXISTS public.post_image_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_image_id UUID NOT NULL REFERENCES public.post_images(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_image_id, user_id)
);

ALTER TABLE public.post_image_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_image_likes_read"
ON public.post_image_likes
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM post_images pi 
  WHERE pi.id = post_image_likes.post_image_id 
  AND (pi.visibility = 'public' OR pi.user_id = auth.uid())
));

CREATE POLICY "post_image_likes_insert"
ON public.post_image_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_image_likes_delete"
ON public.post_image_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Create comments table for post_images
CREATE TABLE IF NOT EXISTS public.post_image_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_image_id UUID NOT NULL REFERENCES public.post_images(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.post_image_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_image_comments_read"
ON public.post_image_comments
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM post_images pi 
  WHERE pi.id = post_image_comments.post_image_id 
  AND (pi.visibility = 'public' OR pi.user_id = auth.uid())
));

CREATE POLICY "post_image_comments_insert"
ON public.post_image_comments
FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "post_image_comments_update"
ON public.post_image_comments
FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "post_image_comments_delete"
ON public.post_image_comments
FOR DELETE
USING (auth.uid() = author_id);

-- Create trigger for updated_at on post_images
CREATE OR REPLACE FUNCTION public.update_post_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_post_images_updated_at ON public.post_images;
CREATE TRIGGER update_post_images_updated_at
BEFORE UPDATE ON public.post_images
FOR EACH ROW
EXECUTE FUNCTION public.update_post_images_updated_at();