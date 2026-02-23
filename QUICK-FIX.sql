-- ============================================
-- QUICK FIX: Add missing columns
-- Run this in Supabase SQL Editor NOW
-- ============================================

-- Add color column (for primary color of clothing item)
ALTER TABLE clothing_items ADD COLUMN IF NOT EXISTS color TEXT;

-- Add name column (for specific item names like "t-shirt", "jeans")
ALTER TABLE clothing_items ADD COLUMN IF NOT EXISTS name TEXT;

-- Done! After running this, uncomment the fields in:
-- app/api/clothing/route.ts (search for "TODO: Uncomment")
