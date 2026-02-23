import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Create clothing item
export async function POST(request: NextRequest) {
  console.log('[DB] Starting clothing item save')
  
  try {
    const body = await request.json()
    const { userEmail, imageUrl, analysis } = body

    console.log('[DB] Request data:', {
      userEmail,
      imageUrl,
      analysisType: analysis?.type
    })

    // First, get or create user
    let userId: string

    console.log('[DB] Looking up user:', userEmail)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (existingUser) {
      console.log('[DB] Existing user found:', existingUser.id)
      userId = existingUser.id
    } else {
      console.log('[DB] Creating new user')
      // Create new user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({ email: userEmail })
        .select('id')
        .single()

      if (userError) {
        console.error('[DB] User creation error:', userError)
        throw userError
      }
      console.log('[DB] New user created:', newUser.id)
      userId = newUser.id
    }

    // Create clothing item
    console.log('[DB] Inserting clothing item for user:', userId)
    const itemData: any = {
      user_id: userId,
      image_url: imageUrl,
      type: analysis.type,
      subtype: analysis.subtype,
      colors: analysis.colors,
      pattern: analysis.pattern,
      season: analysis.season,
      formality: analysis.formality,
      tags: analysis.tags,
      clean: true,
    }

    // Add name field if provided (new format)
    if (analysis.name) {
      itemData.name = analysis.name
    }

    // Add primary color if available
    if (analysis.colors && analysis.colors.length > 0) {
      itemData.color = analysis.colors[0] // Primary color
    }

    const { data, error } = await supabase
      .from('clothing_items')
      .insert(itemData)
      .select()
      .single()

    if (error) {
      console.error('[DB] Insert error:', error)
      throw error
    }

    console.log('[DB] Clothing item saved successfully:', data.id)

    return NextResponse.json({
      success: true,
      item: data,
    })
  } catch (error: any) {
    console.error('[DB] Fatal error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save item' },
      { status: 500 }
    )
  }
}

// Get all clothing items for user
export async function GET(request: NextRequest) {
  console.log('[DB] Fetching clothing items')
  
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('userEmail')

    console.log('[DB] Fetching for user:', userEmail)

    if (!userEmail) {
      console.error('[DB] No userEmail provided')
      return NextResponse.json(
        { error: 'userEmail required' },
        { status: 400 }
      )
    }

    // Get user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (!user) {
      console.log('[DB] User not found, returning empty array')
      return NextResponse.json({
        success: true,
        items: [],
      })
    }

    console.log('[DB] User found:', user.id)

    // Get clothing items
    const { data: items, error } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[DB] Fetch error:', error)
      throw error
    }

    console.log('[DB] Items fetched:', items?.length || 0)

    return NextResponse.json({
      success: true,
      items: items || [],
    })
  } catch (error: any) {
    console.error('[DB] Fatal error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch items' },
      { status: 500 }
    )
  }
}
