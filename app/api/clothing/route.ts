import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Create clothing item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userEmail, imageUrl, analysis } = body

    // First, get or create user
    let userId: string

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (existingUser) {
      userId = existingUser.id
    } else {
      // Create new user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({ email: userEmail })
        .select('id')
        .single()

      if (userError) throw userError
      userId = newUser.id
    }

    // Create clothing item
    const { data, error } = await supabase
      .from('clothing_items')
      .insert({
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
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      item: data,
    })
  } catch (error: any) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save item' },
      { status: 500 }
    )
  }
}

// Get all clothing items for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('userEmail')

    if (!userEmail) {
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
      return NextResponse.json({
        success: true,
        items: [],
      })
    }

    // Get clothing items
    const { data: items, error } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      items: items || [],
    })
  } catch (error: any) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch items' },
      { status: 500 }
    )
  }
}
