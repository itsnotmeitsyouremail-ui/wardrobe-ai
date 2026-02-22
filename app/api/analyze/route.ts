import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json()

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image data required' },
        { status: 400 }
      )
    }

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
            text: `Analyze this clothing item and return ONLY a JSON object with these fields:

{
  "type": "shirt | pants | dress | skirt | jacket | coat | shoes | shorts | sweater | hoodie | blazer | suit | other",
  "subtype": "specific type (e.g., dress_shirt, t-shirt, jeans, sneakers)",
  "colors": ["primary_color", "secondary_color"],
  "pattern": "solid | striped | plaid | checkered | floral | polka_dot | other",
  "season": ["spring", "summer", "fall", "winter"],
  "formality": "casual | business_casual | formal | athletic",
  "tags": ["3-5", "descriptive", "keywords"]
}

Be specific. Use common color names. Return ONLY valid JSON, no other text.`,
          },
        ],
      }),
    })

    const textContent = response.content.find(block => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    const text = textContent.text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const analysis = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      success: true,
      data: analysis,
    })
  } catch (error: any) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    )
  }
}
