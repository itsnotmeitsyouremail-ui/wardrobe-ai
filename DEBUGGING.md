# Debugging Guide

## Comprehensive Logging System

Every function now has detailed step-by-step logging with clear success/failure indicators.

### Log Format

```
[COMPONENT] Step X: ✓/✗ Message
[COMPONENT] ========== START/COMPLETE/FAILED ==========
```

### Components

- `[UPLOAD UI]` - Client-side upload page
- `[UPLOAD API]` - Server-side /api/upload endpoint
- `[ANALYZE]` - Server-side /api/analyze endpoint (OpenAI GPT-4o)
- `[DB API]` - Server-side /api/clothing endpoint

## Viewing Logs

### Browser Console
Open DevTools (F12) → Console tab to see client-side logs:
```
[UPLOAD UI] ========== START UPLOAD FLOW ==========
[UPLOAD UI] Step 1: Fetching user ID...
[UPLOAD UI] Step 1: ✓ User ID: xxx-xxx-xxx
```

### Server Logs
Check your deployment logs (Vercel/Railway/etc.) or local terminal:
```
[ANALYZE] ========== START ANALYSIS ==========
[ANALYZE] Step 1: ✓ Body parsed successfully
[ANALYZE] Step 2: ✓ Image data validated
[ANALYZE] Step 3: Preparing OpenAI API call...
```

## Common Issues & Solutions

### 1. Image Analysis Failing

**Symptoms:**
```
[ANALYZE] ✗ FAIL: No text response from GPT-4o
```

**Check:**
1. Is `OPENAI_API_KEY` set in `.env.local`?
2. Look for the API response details in logs
3. Check OpenAI API quota/billing

**Logs to check:**
```bash
grep -E '\[ANALYZE\].*FAIL' logs
grep -E '\[ANALYZE\].*Error' logs
```

### 2. Upload Failing (404 Bucket Not Found)

**Symptoms:**
```
[UPLOAD API] ✗ FAIL: Supabase upload error
Error: Bucket not found
```

**Solution:**
1. Go to Supabase Dashboard → Storage
2. Create bucket: `wardrobe-ai`
3. Toggle "Public bucket" to **ON**
4. Or run `supabase-setup.sql` in SQL Editor

### 3. No Items Detected

**Symptoms:**
```
[UPLOAD UI] ✗ FAIL: No clothing items detected
```

**Check analysis response:**
```
[ANALYZE] Analysis object: { items: [] }
```

**Possible causes:**
- Image too dark/blurry
- No clear clothing visible
- OpenAI API returned unexpected format

### 4. Database Save Failing

**Symptoms:**
```
[DB API] ✗ FAIL: Insert error
```

**Check:**
1. Are `color` and `name` columns added?
2. Run `supabase-setup.sql` to add missing columns
3. Check error code in logs

## Grepping Logs

### Find all errors:
```bash
grep -E '✗ FAIL|Error|error' logs
```

### Track a specific upload:
```bash
grep '\[UPLOAD' logs | tail -50
```

### See all analysis attempts:
```bash
grep '\[ANALYZE\]' logs
```

### Watch logs in real-time:
```bash
tail -f logs | grep -E 'UPLOAD|ANALYZE|DB'
```

## Log Timestamps

Every operation logs:
- Start time
- Duration for each step
- Total duration
- Error duration (time until failure)

Example:
```
[ANALYZE] Total duration: 2341 ms
[UPLOAD UI] Step 4: ✓ Analysis complete in 2345 ms
```

## Success Flow Example

When everything works, you'll see:

```
[UPLOAD UI] ========== START UPLOAD FLOW ==========
[UPLOAD UI] Step 1: ✓ User ID: abc-123
[UPLOAD API] ========== START UPLOAD ==========
[UPLOAD API] Step 3: ✓ Upload successful in 450 ms
[UPLOAD UI] Step 3: ✓ Base64 conversion complete
[ANALYZE] ========== START ANALYSIS ==========
[ANALYZE] Step 4: ✓ GPT-4o response received in 2341 ms
[ANALYZE] Step 8: ✓ Found 3 clothing items
[ANALYZE] ========== ANALYSIS COMPLETE ==========
[DB API] ========== START SAVE ITEM ==========
[DB API] Step 4: ✓ Insert successful in 89 ms
[UPLOAD UI] ========== UPLOAD COMPLETE ==========
```

## Failed Flow Example

When something breaks:

```
[UPLOAD UI] ========== START UPLOAD FLOW ==========
[UPLOAD UI] Step 1: ✓ User ID: abc-123
[ANALYZE] ========== START ANALYSIS ==========
[ANALYZE] Step 4: Calling OpenAI API...
[ANALYZE] ✗ FAIL: No text response from GPT-4o
[ANALYZE] Error message: API rate limit exceeded
[ANALYZE] ========== ANALYSIS FAILED ==========
[UPLOAD UI] ========== UPLOAD FAILED ==========
[UPLOAD UI] Error: Analysis failed: API rate limit exceeded
```

## Next Steps After Seeing Logs

1. **Check the ✗ FAIL message** - It tells you exactly what went wrong
2. **Look at the step number** - Shows how far the process got
3. **Check error details** - Stack trace, error codes, API responses
4. **Verify environment variables** - API keys, Supabase credentials
5. **Run supabase-setup.sql** - Ensures DB schema is correct
