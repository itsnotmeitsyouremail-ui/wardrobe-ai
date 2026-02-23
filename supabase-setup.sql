-- Create storage bucket for wardrobe images
INSERT INTO storage.buckets (id, name, public)
VALUES ('wardrobe-ai', 'wardrobe-ai', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Set bucket to public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'wardrobe-ai';

-- Allow public access to all files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'wardrobe-ai');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'wardrobe-ai');

-- Allow users to delete their own files
CREATE POLICY "User Delete Own Files"
ON storage.objects FOR DELETE
USING (bucket_id = 'wardrobe-ai');

-- Add color field to clothing_items if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clothing_items' 
    AND column_name = 'color'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN color TEXT;
  END IF;
END $$;

-- Add name field to clothing_items if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clothing_items' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN name TEXT;
  END IF;
END $$;
