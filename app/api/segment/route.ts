import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[SEGMENT] ========== START BACKGROUND REMOVAL ==========')
  console.log('[SEGMENT] Timestamp:', new Date().toISOString())
  
  try {
    console.log('[SEGMENT] Step 1: Parsing request...')
    const { imageBase64, itemName } = await request.json()
    
    console.log('[SEGMENT] Step 1: ✓ Request parsed')
    console.log('[SEGMENT] Item name:', itemName)
    console.log('[SEGMENT] Image size:', imageBase64?.length || 0)

    if (!imageBase64) {
      console.error('[SEGMENT] ✗ FAIL: No image data')
      return NextResponse.json(
        { error: 'Image data required' },
        { status: 400 }
      )
    }

    const REMOVEBG_API_KEY = process.env.REMOVEBG_API_KEY
    const USE_REMOVEBG = process.env.USE_BACKGROUND_REMOVAL === 'true'

    if (!USE_REMOVEBG) {
      console.log('[SEGMENT] Background removal disabled (USE_BACKGROUND_REMOVAL=false)')
      console.log('[SEGMENT] Returning original image')
      return NextResponse.json({
        success: true,
        imageBase64, // Return original without background removal
        segmented: false,
      })
    }

    if (!REMOVEBG_API_KEY) {
      console.error('[SEGMENT] ✗ FAIL: REMOVEBG_API_KEY not configured')
      console.log('[SEGMENT] Fallback: returning original image')
      return NextResponse.json({
        success: true,
        imageBase64, // Fallback to original
        segmented: false,
        warning: 'Background removal not configured',
      })
    }

    console.log('[SEGMENT] Step 2: Calling remove.bg API...')
    console.log('[SEGMENT] API Key present:', !!REMOVEBG_API_KEY)

    const apiCallStart = Date.now()

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64')
    
    console.log('[SEGMENT] Image buffer size:', imageBuffer.length, 'bytes')

    const formData = new FormData()
    formData.append('image_file_b64', imageBase64)
    formData.append('size', 'auto') // auto, preview, full, or specific resolution
    formData.append('type', 'auto') // auto, person, product, car
    formData.append('format', 'png') // png or jpg

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVEBG_API_KEY,
      },
      body: formData,
    })

    const apiCallDuration = Date.now() - apiCallStart
    console.log('[SEGMENT] Step 2: API call completed in', apiCallDuration, 'ms')
    console.log('[SEGMENT] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[SEGMENT] ✗ FAIL: API error')
      console.error('[SEGMENT] Status:', response.status)
      console.error('[SEGMENT] Error:', errorText)
      
      // Fallback to original image
      return NextResponse.json({
        success: true,
        imageBase64, // Return original on error
        segmented: false,
        error: `Background removal failed: ${errorText}`,
      })
    }

    console.log('[SEGMENT] Step 3: Converting response to base64...')
    
    const resultBuffer = await response.arrayBuffer()
    const resultBase64 = Buffer.from(resultBuffer).toString('base64')

    console.log('[SEGMENT] Step 3: ✓ Conversion complete')
    console.log('[SEGMENT] Result size:', resultBase64.length)

    // Get API credits info from headers
    const creditsRemaining = response.headers.get('X-Credits-Remaining')
    const creditsCharged = response.headers.get('X-Credits-Charged')
    
    console.log('[SEGMENT] API Credits:', {
      remaining: creditsRemaining,
      charged: creditsCharged,
    })

    const totalDuration = Date.now() - startTime
    console.log('[SEGMENT] ========== SEGMENTATION COMPLETE ==========')
    console.log('[SEGMENT] Total duration:', totalDuration, 'ms')

    return NextResponse.json({
      success: true,
      imageBase64: resultBase64,
      segmented: true,
      credits: {
        remaining: creditsRemaining,
        charged: creditsCharged,
      },
    })
  } catch (error: any) {
    const totalDuration = Date.now() - startTime
    console.error('[SEGMENT] ========== SEGMENTATION FAILED ==========')
    console.error('[SEGMENT] Duration before error:', totalDuration, 'ms')
    console.error('[SEGMENT] Error:', error.message)
    console.error('[SEGMENT] Stack:', error.stack)
    
    return NextResponse.json(
      { 
        error: error.message || 'Background removal failed',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}
