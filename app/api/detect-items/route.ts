import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import sharp from 'sharp'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[DETECT ITEMS] ========== START ITEM DETECTION ==========')
  console.log('[DETECT ITEMS] Timestamp:', new Date().toISOString())
  
  try {
    console.log('[DETECT ITEMS] Step 1: Parsing request...')
    const { imageBase64, items } = await request.json()
    
    console.log('[DETECT ITEMS] Step 1: ✓ Request parsed')
    console.log('[DETECT ITEMS] Items to detect:', items.length)
    console.log('[DETECT ITEMS] Item names:', items.map((i: any) => i.name).join(', '))

    if (!imageBase64 || !items || items.length === 0) {
      console.error('[DETECT ITEMS] ✗ FAIL: Missing required data')
      return NextResponse.json(
        { error: 'Image and items required' },
        { status: 400 }
      )
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      console.error('[DETECT ITEMS] ✗ FAIL: REPLICATE_API_TOKEN not configured')
      return NextResponse.json(
        { error: 'Replicate API not configured' },
        { status: 500 }
      )
    }

    // Convert base64 to data URL for Replicate
    const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`

    console.log('[DETECT ITEMS] Step 2: Using GroundingDINO for object detection...')
    console.log('[DETECT ITEMS] This will detect bounding boxes for each item')
    
    const apiCallStart = Date.now()

    // Build text prompt from all items
    const textPrompt = items.map((i: any) => i.name || i.type).join(', ')
    console.log('[DETECT ITEMS] Text prompt:', textPrompt)

    // Use GroundingDINO for object detection with bounding boxes
    const detection = await replicate.run(
      "adirik/grounding-dino:efd10a8ddc57ea28773327e881ce95e20cc1d734c589f7dd01d2036921ed78aa",
      {
        input: {
          image: imageDataUrl,
          query: textPrompt,
          box_threshold: 0.3,
          text_threshold: 0.25,
        }
      }
    ) as any

    const apiCallDuration = Date.now() - apiCallStart
    console.log('[DETECT ITEMS] Step 2: ✓ Detection completed in', apiCallDuration, 'ms')
    console.log('[DETECT ITEMS] Detection output:', JSON.stringify(detection, null, 2))

    // Parse detection results
    // GroundingDINO returns: { boxes: [[x1,y1,x2,y2], ...], labels: [...], scores: [...] }
    const detectedBoxes = detection.boxes || []
    const detectedLabels = detection.labels || []
    const detectedScores = detection.scores || []

    console.log('[DETECT ITEMS] Detected boxes:', detectedBoxes.length)
    console.log('[DETECT ITEMS] Labels:', detectedLabels)
    console.log('[DETECT ITEMS] Scores:', detectedScores)

    if (detectedBoxes.length === 0) {
      console.log('[DETECT ITEMS] No boxes detected, returning original items')
      return NextResponse.json({
        success: true,
        items: items.map((item: any) => ({
          item,
          croppedBase64: null,
          box: null,
          detected: false,
        })),
      })
    }

    console.log('[DETECT ITEMS] Step 3: Matching detected boxes to items...')
    
    // Get image dimensions
    const imageBuffer = Buffer.from(imageBase64, 'base64')
    const image = sharp(imageBuffer)
    const metadata = await image.metadata()
    const width = metadata.width!
    const height = metadata.height!
    
    console.log('[DETECT ITEMS] Image dimensions:', width, 'x', height)

    // Match each item to a detected box
    const processedItems = await Promise.all(
      items.map(async (item: any, index: number) => {
        try {
          // Find best matching box for this item
          let bestBoxIndex = -1
          let bestScore = 0

          for (let i = 0; i < detectedLabels.length; i++) {
            const label = detectedLabels[i].toLowerCase()
            const itemName = (item.name || item.type).toLowerCase()
            
            // Simple matching: check if label contains item type or name
            if (label.includes(itemName) || itemName.includes(label) || 
                label.includes(item.type.toLowerCase())) {
              if (detectedScores[i] > bestScore) {
                bestScore = detectedScores[i]
                bestBoxIndex = i
              }
            }
          }

          if (bestBoxIndex === -1) {
            console.log(`[DETECT ITEMS] No match found for ${item.name}, using fallback`)
            // Use the next available box if no match
            bestBoxIndex = index < detectedBoxes.length ? index : 0
          }

          const box = detectedBoxes[bestBoxIndex]
          console.log(`[DETECT ITEMS] Item ${index + 1} "${item.name}" matched to box ${bestBoxIndex}:`, box)

          // Convert normalized coordinates to pixels
          const x1 = Math.floor(box[0] * width)
          const y1 = Math.floor(box[1] * height)
          const x2 = Math.ceil(box[2] * width)
          const y2 = Math.ceil(box[3] * height)
          
          const cropWidth = x2 - x1
          const cropHeight = y2 - y1

          console.log(`[DETECT ITEMS] Cropping region: ${x1},${y1} ${cropWidth}x${cropHeight}`)

          // Crop the image
          const croppedBuffer = await sharp(imageBuffer)
            .extract({ left: x1, top: y1, width: cropWidth, height: cropHeight })
            .toBuffer()

          const croppedBase64 = croppedBuffer.toString('base64')
          
          console.log(`[DETECT ITEMS] ✓ Item ${index + 1} cropped, size: ${croppedBase64.length} bytes`)

          return {
            item,
            croppedBase64,
            box: { x1, y1, x2, y2 },
            detected: true,
            label: detectedLabels[bestBoxIndex],
            score: detectedScores[bestBoxIndex],
          }
        } catch (error: any) {
          console.error(`[DETECT ITEMS] ✗ FAIL: Item ${index + 1} processing failed:`, error.message)
          return {
            item,
            croppedBase64: null,
            box: null,
            detected: false,
            error: error.message,
          }
        }
      })
    )

    const totalDuration = Date.now() - startTime
    console.log('[DETECT ITEMS] ========== DETECTION COMPLETE ==========')
    console.log('[DETECT ITEMS] Total duration:', totalDuration, 'ms')
    console.log('[DETECT ITEMS] Success count:', processedItems.filter(i => i.detected).length)
    console.log('[DETECT ITEMS] Failed count:', processedItems.filter(i => !i.detected).length)

    return NextResponse.json({
      success: true,
      items: processedItems,
      duration: totalDuration,
    })
  } catch (error: any) {
    const totalDuration = Date.now() - startTime
    console.error('[DETECT ITEMS] ========== DETECTION FAILED ==========')
    console.error('[DETECT ITEMS] Duration before error:', totalDuration, 'ms')
    console.error('[DETECT ITEMS] Error:', error.message)
    console.error('[DETECT ITEMS] Stack:', error.stack)
    
    return NextResponse.json(
      { 
        error: error.message || 'Item detection failed',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}
