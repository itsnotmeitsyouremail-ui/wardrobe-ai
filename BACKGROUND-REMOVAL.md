# Background Removal Feature

## Overview

The app can now **separate individual clothing items** from a single photo and save each piece with a **transparent background**.

**Example:**
- Upload: Person wearing blue kurta + white pants
- Result: 
  - Item 1: Blue kurta (PNG with transparent background)
  - Item 2: White pants (PNG with transparent background)

## How It Works

1. **Upload image** → GPT-4o detects all clothing items
2. **For each item** → Remove.bg API removes background
3. **Individual upload** → Each item saved as separate PNG
4. **Database** → Each item has its own image URL

## Setup

### Option 1: Use Remove.bg API (Recommended)

1. **Get API Key:**
   - Go to https://www.remove.bg/api
   - Sign up for free (50 free API calls/month)
   - Copy your API key

2. **Configure `.env.local`:**
   ```env
   USE_BACKGROUND_REMOVAL=true
   REMOVEBG_API_KEY=your_api_key_here
   ```

3. **Pricing:**
   - Free: 50 images/month
   - Paid: $0.20/image (pay as you go)
   - Subscription: Starting at $9/month for 500 credits

### Option 2: Disable Background Removal

Keep images as-is (no transparent backgrounds):

```env
USE_BACKGROUND_REMOVAL=false
```

The app will still detect and separate items, but save the original image for each item.

## API Behavior

### When Enabled:
```
[SEGMENT] ========== START BACKGROUND REMOVAL ==========
[SEGMENT] Step 1: ✓ Request parsed
[SEGMENT] Step 2: API call completed in 1234 ms
[SEGMENT] Step 3: ✓ Conversion complete
[SEGMENT] ========== SEGMENTATION COMPLETE ==========
```

### When Disabled:
```
[SEGMENT] Background removal disabled (USE_BACKGROUND_REMOVAL=false)
[SEGMENT] Returning original image
```

### API Failure Fallback:
If remove.bg API fails (rate limit, error, etc.), the app automatically falls back to the original image:

```
[SEGMENT] ✗ FAIL: API error
[SEGMENT] Fallback: returning original image
```

## Upload Flow

### Before (Single Image):
1. Upload → Storage → Analyze → Save to DB
2. All items share same image

### After (Individual Items):
1. Upload original
2. Analyze with GPT-4o (detect all items)
3. **For each item:**
   - Segment (remove background)
   - Upload individual PNG
   - Save with unique image URL
4. Result: Each item has its own transparent background image

## File Naming

Segmented images are named:
```
{item-name}-{timestamp}.png
```

Examples:
- `blue-kurta-1771805532480.png`
- `white-pants-1771805532481.png`
- `sneakers-1771805532482.png`

## Wardrobe Display

Each item now shows with its transparent background:
- Perfect for outfit suggestions (can layer items)
- Clean product-like display
- No background clutter

## Troubleshooting

### "Background removal not configured"
- Add `REMOVEBG_API_KEY` to `.env.local`
- Or set `USE_BACKGROUND_REMOVAL=false`

### "API rate limit exceeded"
- You've used your monthly quota
- Upgrade plan or wait for reset
- App will fallback to original images

### Slow uploads
- Background removal adds ~2-3 seconds per item
- Disable if speed is critical
- Consider batch processing for large wardrobes

## Alternatives to Remove.bg

### Self-Hosted Options:
1. **rembg** (Python library, free)
   - Requires hosting your own API
   - Uses U2-Net model
   
2. **Cloudinary** (has free tier)
   - Built-in background removal
   - Requires account

3. **Segment Anything Model (SAM)**
   - Facebook's Meta AI
   - Requires GPU hosting

Would you like help setting up any of these alternatives?
