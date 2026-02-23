-- ============================================
-- SUPABASE SETUP SQL - SAFE TO RUN MULTIPLE TIMES
-- ============================================
-- This file is IDEMPOTENT - it will not destroy existing data
-- It only adds missing tables, columns, and policies
-- Safe to run after every update
-- ============================================

-- 1. Create storage bucket for wardrobe images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('wardrobe-ai', 'wardrobe-ai', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Ensure bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'wardrobe-ai';

-- 3. Create storage policies (if not exist)
-- Note: If policies already exist, these will error but it's safe to ignore
DO $$ 
BEGIN
  -- Public read access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Public Access'
  ) THEN
    CREATE POLICY "Public Access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'wardrobe-ai');
  END IF;

  -- Authenticated upload
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Authenticated Upload'
  ) THEN
    CREATE POLICY "Authenticated Upload"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'wardrobe-ai');
  END IF;

  -- User delete own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'User Delete Own Files'
  ) THEN
    CREATE POLICY "User Delete Own Files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'wardrobe-ai');
  END IF;
END $$;

-- 4. Add color field to clothing_items (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clothing_items' 
    AND column_name = 'color'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN color TEXT;
    RAISE NOTICE 'Added color column to clothing_items';
  ELSE
    RAISE NOTICE 'color column already exists in clothing_items';
  END IF;
END $$;

-- 5. Add name field to clothing_items (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clothing_items' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN name TEXT;
    RAISE NOTICE 'Added name column to clothing_items';
  ELSE
    RAISE NOTICE 'name column already exists in clothing_items';
  END IF;
END $$;

-- ============================================
-- SETUP COMPLETE
-- All changes are idempotent and safe
-- Your existing data is preserved
-- ============================================
