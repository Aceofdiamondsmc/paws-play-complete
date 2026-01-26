-- Create storage bucket for service images
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to service images
CREATE POLICY "service_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');

-- Allow service role to upload service images
CREATE POLICY "service_images_service_role_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'service-images');

-- Allow service role to update service images
CREATE POLICY "service_images_service_role_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'service-images')
WITH CHECK (bucket_id = 'service-images');

-- Allow service role to delete service images
CREATE POLICY "service_images_service_role_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'service-images');