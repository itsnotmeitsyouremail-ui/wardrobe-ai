# Setup Instructions

## Supabase Configuration

### 1. Create Storage Bucket

Go to your Supabase Dashboard → Storage and run the SQL from `supabase-setup.sql`:

```sql
-- This will:
-- 1. Create the 'wardrobe-ai' bucket (if it doesn't exist)
-- 2. Make it public
-- 3. Set up access policies
-- 4. Add 'color' and 'name' fields to clothing_items table
```

**OR manually via UI:**
1. Go to Storage → Create new bucket
2. Name: `wardrobe-ai`
3. Toggle "Public bucket" to **ON**
4. Click Create

### 2. Run Database Migrations

Go to SQL Editor and run:

```sql
-- Add color field
ALTER TABLE clothing_items ADD COLUMN IF NOT EXISTS color TEXT;

-- Add name field (specific item name like "t-shirt", "jeans", etc.)
ALTER TABLE clothing_items ADD COLUMN IF NOT EXISTS name TEXT;
```

### 3. Verify Storage Policy

Make sure your storage policies allow:
- **Public read** for all files
- **Authenticated upload** for users

You can test by uploading an image and checking if this URL works:
```
https://dhvctvblqddsqtdbmmiu.supabase.co/storage/v1/object/public/wardrobe-ai/[user-id]/[filename].jpeg
```

## Troubleshooting

### "Bucket not found" error:
- Make sure bucket name is exactly `wardrobe-ai`
- Verify the bucket is set to Public
- Check RLS policies are correct

### Images not loading:
- Verify bucket exists and is public
- Check the image URL format
- Make sure storage policies allow public read access
