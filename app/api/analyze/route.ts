import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  console.log('[ANALYZE] Starting Claude Vision analysis')
  
  try {
    const { imageBase64 } = await request.json()

    console.log('[ANALYZE] Image data received, size:', imageBase64?.length || 0, 'bytes')

    if (!imageBase64) {
      console.error('[ANALYZE] No image data provided')
      return NextResponse.json(
        { error: 'Image data required' },
        { status: 400 }
      )
    }

    console.log('[ANALYZE] Calling Claude API with model: claude-3-5-sonnet-20241022')

    const prompt = 'Analyze this clothing item and return ONLY a JSON object with these fields:\n\n' +
      '{\n' +
      '  "type": "shirt | pants | dress | skirt | jacket | coat | shoes | shorts | sweater | hoodie | blazer | suit | other",\n' +
      '  "subtype": "specific type (e.g., dress_shirt, t-shirt, jeans, sneakers)",\n' +
      '  "colors": ["primary_color", "secondary_color"],\n' +
      '  "pattern": "solid | striped | plaid | checkered | floral | polka_dot | other",\n' +
      '  "season": ["spring", "summer", "fall", "winter"],\n' +
      '  "formality": "casual | business_casual | formal | athletic",\n' +
      '  "tags": ["3-5", "descriptive", "keywords"]\n' +
      '}\n\n' +
      'Be specific. Use common color names. Return ONLY valid JSON, no other text.'

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      }],
    })

    console.log('[ANALYZE] Claude response received')

    const textContent = response.content.find(block => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      console.error('[ANALYZE] No text content in response')
      throw new Error('No text response from Claude')
    }

    const text = textContent.text
    console.log('[ANALYZE] Claude raw response:', text)

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      console.error('[ANALYZE] No JSON found in Claude response')
      throw new Error('No JSON found in response')
    }

    const analysis = JSON.parse(jsonMatch[0])
    console.log('[ANALYZE] Parsed analysis:', analysis)

    return NextResponse.json({
      success: true,
      data: analysis,
    })
  } catch (error: any) {
    console.error('[ANALYZE] Fatal error:', error)
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    )
  }
}
