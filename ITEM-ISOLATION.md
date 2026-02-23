# Individual Item Isolation Feature

## What This Solves

**Problem:** When uploading a photo with multiple items (blue shirt + white pants + shoes), all items shared the same full-body image.

**Solution:** Each clothing item is now **detected, cropped, and isolated** into its own separate image with transparent background.

## Example

### Before:
Upload: Person wearing blue kurta + white pants + brown shoes

Result:
- Blue Kurta → Full body photo (all items visible)
- White Pants → Same full body photo
- Brown Shoes → Same full body photo

### After:
Upload: Person wearing blue kurta + white pants + brown shoes

Result:
- Blue Kurta → **ONLY the kurta** (cropped, transparent background)
- White Pants → **ONLY the pants** (cropped, transparent background)
- Brown Shoes → **ONLY the shoes** (cropped, transparent background)

## Tech Stack

### The "Expensive Route" (Current Implementation)

We're using premium AI services for maximum accuracy:

1. **OpenAI GPT-4o** (~$0.01/image)
   - Identifies what items are in the photo
   - Returns structured list with names, colors, types

2. **Replicate GroundingDINO** (~$0.005-0.02/image)
   - Object detection with bounding boxes
   - Finds exact pixel coordinates of each item
   - Crops image to just that item

3. **Remove.bg API** (~$0.20/image or free 50/month)
   - Removes background from cropped items
   - Returns transparent PNG

**Total Cost per Photo:** ~$0.22-0.25 per image (assuming 1 item)
**For 3 items:** ~$0.65-0.75 per photo

## Setup

### 1. Get Replicate API Token

1. Go to https://replicate.com/account/api-tokens
2. Create account (free tier available)
3. Copy your API token
4. Add to `.env.local`:
   ```env
   REPLICATE_API_TOKEN=r8_your_token_here
   ```

### 2. Pricing

**Replicate Pricing:**
- GroundingDINO: ~$0.0023 per run
- Pay only for what you use
- No monthly minimums

**Free Tier:**
- $5 free credit on signup
- Enough for ~2,000 images

### 3. Test It

```bash
# Restart dev server
npm run dev

# Upload a photo with multiple items
# Watch the logs:
```

Expected logs:
```
[UPLOAD UI] Step 5.5: Detecting item locations and cropping...
[DETECT ITEMS] Using GroundingDINO for object detection
[DETECT ITEMS] Detected boxes: 3
[DETECT ITEMS] Item 1 "blue kurta" matched to box 0
[DETECT ITEMS] ✓ Item 1 cropped
[UPLOAD UI] Step 5.6: Removing backgrounds from cropped items...
[SEGMENT] ✓ Background removed
```

## How It Works

### Full Pipeline:

```
1. Upload Photo
   ↓
2. GPT-4o Analysis
   → Identifies: "blue kurta", "white pants", "brown shoes"
   ↓
3. GroundingDINO Detection
   → Finds bounding boxes: [(10,20,100,200), (15,210,110,400), (40,410,80,480)]
   ↓
4. Crop Each Item
   → Creates 3 separate cropped images
   ↓
5. Remove Background (Remove.bg)
   → Transparent PNG for each item
   ↓
6. Upload to Storage
   → blue-kurta-123.png
   → white-pants-123.png
   → brown-shoes-123.png
   ↓
7. Save to Database
   → Each item has its own image URL
```

## Wardrobe Display

Now in your wardrobe view, you see:
- **Clean product-like images** of each individual item
- **Transparent backgrounds** (no person, no clutter)
- **Perfect for outfit suggestions** (AI can layer items)

## Future Optimization

The current "expensive route" can be optimized later:

### Option 1: Self-Host GroundingDINO
- One-time GPU server cost
- Free after setup
- Saves ~$0.02 per image

### Option 2: Batch Processing
- Process multiple items at once
- Reduce API calls
- Save ~30-40%

### Option 3: Cache Results
- Store cropped regions
- Reuse for similar uploads
- Save on re-processing

### Option 4: Hybrid Approach
- Use GroundingDINO only for complex photos
- Simple rule-based cropping for single items
- Save ~50% on costs

## Troubleshooting

### "REPLICATE_API_TOKEN not configured"
- Add your token to `.env.local`
- Restart dev server

### Items not detected
- Check logs for detection output
- GroundingDINO returns empty boxes
- Fallback: uses original image

### Background removal fails
- Check Remove.bg API credits
- Fallback: uses cropped image without transparent background

### Slow uploads
- Detection + background removal takes ~5-10 seconds per item
- Photo with 3 items = ~15-30 seconds total
- This is the "expensive route" trade-off (accuracy > speed)

## Cost Monitoring

Watch your costs in logs:
```
[DETECT ITEMS] Total duration: 2341 ms
[SEGMENT] Credits remaining: 47
```

Track your spending:
- **Replicate Dashboard:** https://replicate.com/account/billing
- **Remove.bg Dashboard:** https://www.remove.bg/users/sign_in

## Why This Approach?

You asked for the "expensive route" to get it working now, optimize later:

✅ **Pros:**
- Highest accuracy
- No server maintenance
- Works immediately
- Easy to implement
- Scalable (pay per use)

❌ **Cons:**
- ~$0.25-0.75 per photo
- Slower than local processing
- Dependent on external APIs

**Plan:** Use this for MVP, then optimize with self-hosting once you validate the feature.
