import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[ANALYZE] ========== START ANALYSIS ==========')
  console.log('[ANALYZE] Timestamp:', new Date().toISOString())
  console.log('[ANALYZE] Starting GPT-4o Vision analysis')
  
  try {
    console.log('[ANALYZE] Step 1: Parsing request body...')
    const { imageBase64 } = await request.json()
    console.log('[ANALYZE] Step 1: ✓ Body parsed successfully')

    console.log('[ANALYZE] Step 2: Validating image data...')
    console.log('[ANALYZE] Image data received:', {
      exists: !!imageBase64,
      type: typeof imageBase64,
      length: imageBase64?.length || 0,
      firstChars: imageBase64?.substring(0, 50) || 'N/A'
    })

    if (!imageBase64) {
      console.error('[ANALYZE] ✗ FAIL: No image data provided')
      return NextResponse.json(
        { error: 'Image data required' },
        { status: 400 }
      )
    }
    console.log('[ANALYZE] Step 2: ✓ Image data validated')

    console.log('[ANALYZE] Step 3: Preparing OpenAI API call...')
    console.log('[ANALYZE] Model: gpt-4o')
    console.log('[ANALYZE] Max tokens: 1024')
    console.log('[ANALYZE] API Key present:', !!process.env.OPENAI_API_KEY)
    console.log('[ANALYZE] API Key length:', process.env.OPENAI_API_KEY?.length || 0)

    const prompt = 'Analyze this image and extract ALL visible clothing items. If a person is wearing multiple items (shirt, pants, shoes, etc.), list each one separately.\n\n' +
      'Return ONLY a JSON object with an "items" array:\n\n' +
      '{\n' +
      '  "items": [\n' +
      '    {\n' +
      '      "name": "specific clothing name (e.g., t-shirt, jeans, sneakers, kurta, blazer, dress shirt, polo shirt, half sleeve shirt, full sleeve shirt, formal pants, chinos, loafers, oxford shoes, dress, skirt, shorts, hoodie, sweater, jacket, coat, suit jacket, suit pants, ethnic wear, traditional wear)",\n' +
      '      "type": "shirt | pants | dress | skirt | jacket | coat | shoes | shorts | sweater | hoodie | blazer | suit | kurta | ethnic | footwear | other",\n' +
      '      "colors": ["primary_color", "secondary_color"],\n' +
      '      "pattern": "solid | striped | plaid | checkered | floral | polka_dot | printed | embroidered | other",\n' +
      '      "season": ["spring", "summer", "fall", "winter"],\n' +
      '      "formality": "casual | business_casual | formal | athletic | ethnic",\n' +
      '      "tags": ["descriptive", "keywords", "style"]\n' +
      '    }\n' +
      '  ]\n' +
      '}\n\n' +
      'Be very specific with names. Use common terms people would search for. Include cultural clothing terms (kurta, sherwani, saree, etc.). Return ONLY valid JSON, no other text.'

    console.log('[ANALYZE] Step 4: Calling OpenAI API...')
    const apiCallStart = Date.now()
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      }],
    })

    const apiCallDuration = Date.now() - apiCallStart
    console.log('[ANALYZE] Step 4: ✓ GPT-4o response received')
    console.log('[ANALYZE] API call duration:', apiCallDuration, 'ms')
    console.log('[ANALYZE] Response object:', {
      id: response.id,
      model: response.model,
      choices: response.choices?.length || 0,
      usage: response.usage
    })

    console.log('[ANALYZE] Step 5: Extracting response text...')
    const text = response.choices[0]?.message?.content
    
    if (!text) {
      console.error('[ANALYZE] ✗ FAIL: No text content in response')
      console.error('[ANALYZE] Response structure:', JSON.stringify(response, null, 2))
      throw new Error('No text response from GPT-4o')
    }
    
    console.log('[ANALYZE] Step 5: ✓ Text extracted')
    console.log('[ANALYZE] Raw response length:', text.length)
    console.log('[ANALYZE] Raw response:', text)

    console.log('[ANALYZE] Step 6: Parsing JSON from response...')
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      console.error('[ANALYZE] ✗ FAIL: No JSON found in GPT-4o response')
      console.error('[ANALYZE] Full response text:', text)
      throw new Error('No JSON found in response')
    }
    
    console.log('[ANALYZE] Step 6: ✓ JSON pattern matched')
    console.log('[ANALYZE] Matched JSON:', jsonMatch[0])

    console.log('[ANALYZE] Step 7: Parsing JSON...')
    let analysis
    try {
      analysis = JSON.parse(jsonMatch[0])
      console.log('[ANALYZE] Step 7: ✓ JSON parsed successfully')
    } catch (parseError: any) {
      console.error('[ANALYZE] ✗ FAIL: JSON parse error:', parseError.message)
      console.error('[ANALYZE] Failed JSON string:', jsonMatch[0])
      throw new Error(`JSON parse failed: ${parseError.message}`)
    }

    console.log('[ANALYZE] Parsed analysis structure:', {
      hasItems: !!analysis.items,
      isArray: Array.isArray(analysis.items),
      itemCount: analysis.items?.length || 0
    })

    // Ensure items array exists
    if (!analysis.items || !Array.isArray(analysis.items)) {
      console.error('[ANALYZE] ✗ FAIL: Invalid response structure - missing items array')
      console.error('[ANALYZE] Analysis object:', JSON.stringify(analysis, null, 2))
      throw new Error('Invalid response structure - expected { items: [...] }')
    }

    console.log('[ANALYZE] Step 8: ✓ Found', analysis.items.length, 'clothing items')
    analysis.items.forEach((item: any, index: number) => {
      console.log(`[ANALYZE] Item ${index + 1}:`, {
        name: item.name,
        type: item.type,
        colors: item.colors,
        pattern: item.pattern
      })
    })

    const totalDuration = Date.now() - startTime
    console.log('[ANALYZE] ========== ANALYSIS COMPLETE ==========')
    console.log('[ANALYZE] Total duration:', totalDuration, 'ms')
    console.log('[ANALYZE] Success! Returning', analysis.items.length, 'items')

    return NextResponse.json({
      success: true,
      data: analysis,
    })
  } catch (error: any) {
    const totalDuration = Date.now() - startTime
    console.error('[ANALYZE] ========== ANALYSIS FAILED ==========')
    console.error('[ANALYZE] Duration before error:', totalDuration, 'ms')
    console.error('[ANALYZE] Error type:', error.constructor.name)
    console.error('[ANALYZE] Error message:', error.message)
    console.error('[ANALYZE] Error stack:', error.stack)
    
    if (error.response) {
      console.error('[ANALYZE] API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      })
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Analysis failed',
        details: error.toString(),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
