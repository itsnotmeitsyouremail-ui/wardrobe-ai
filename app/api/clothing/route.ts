import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Create clothing item
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[DB API] ========== START SAVE ITEM ==========')
  console.log('[DB API] Timestamp:', new Date().toISOString())
  
  try {
    console.log('[DB API] Step 1: Parsing request body...')
    const body = await request.json()
    const { userEmail, imageUrl, analysis } = body

    console.log('[DB API] Step 1: ✓ Body parsed')
    console.log('[DB API] Request data:', {
      userEmail,
      imageUrl,
      analysisKeys: Object.keys(analysis || {})
    })
    console.log('[DB API] Analysis details:', analysis)

    // First, get or create user
    let userId: string

    console.log('[DB API] Step 2: Looking up user...')
    console.log('[DB API] User email:', userEmail)
    
    const { data: existingUser, error: lookupError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error('[DB API] ✗ FAIL: User lookup error:', lookupError)
      throw lookupError
    }

    if (existingUser) {
      console.log('[DB API] Step 2: ✓ Existing user found')
      console.log('[DB API] User ID:', existingUser.id)
      userId = existingUser.id
    } else {
      console.log('[DB API] Step 2: User not found, creating...')
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({ email: userEmail })
        .select('id')
        .single()

      if (userError) {
        console.error('[DB API] ✗ FAIL: User creation error:', userError)
        throw userError
      }
      console.log('[DB API] Step 2: ✓ New user created')
      console.log('[DB API] User ID:', newUser.id)
      userId = newUser.id
    }

    // Create clothing item
    console.log('[DB API] Step 3: Preparing item data...')
    console.log('[DB API] User ID for insert:', userId)
    
    // Core required fields only
    // NOTE: 'name' and 'color' fields require running supabase-setup.sql first
    const itemData: any = {
      user_id: userId,
      image_url: imageUrl,
      type: analysis.type || 'other',
      subtype: analysis.subtype || analysis.name || 'unknown',
      colors: analysis.colors || [],
      pattern: analysis.pattern || 'solid',
      season: analysis.season || ['all'],
      formality: analysis.formality || 'casual',
      tags: analysis.tags || [],
      clean: true,
    }

    // TODO: Uncomment these lines after running supabase-setup.sql
    // This adds the 'name' and 'color' columns
    /*
    if (analysis.name) {
      itemData.name = analysis.name
    }
    if (analysis.colors && analysis.colors.length > 0) {
      itemData.color = analysis.colors[0]
    }
    */

    console.log('[DB API] Step 3: ✓ Item data prepared')
    console.log('[DB API] ⚠️  WARNING: name/color fields disabled until you run supabase-setup.sql')
    console.log('[DB API] Item data:', itemData)

    console.log('[DB API] Step 4: Inserting into database...')
    const insertStart = Date.now()

    const { data, error } = await supabase
      .from('clothing_items')
      .insert(itemData)
      .select()
      .single()

    const insertDuration = Date.now() - insertStart

    if (error) {
      console.error('[DB API] ✗ FAIL: Insert error')
      console.error('[DB API] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      throw error
    }

    console.log('[DB API] Step 4: ✓ Insert successful in', insertDuration, 'ms')
    console.log('[DB API] Saved item ID:', data.id)

    const totalDuration = Date.now() - startTime
    console.log('[DB API] ========== SAVE COMPLETE ==========')
    console.log('[DB API] Total duration:', totalDuration, 'ms')

    return NextResponse.json({
      success: true,
      item: data,
    })
  } catch (error: any) {
    const totalDuration = Date.now() - startTime
    console.error('[DB API] ========== SAVE FAILED ==========')
    console.error('[DB API] Duration before error:', totalDuration, 'ms')
    console.error('[DB API] Error type:', error.constructor.name)
    console.error('[DB API] Error message:', error.message)
    console.error('[DB API] Error details:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to save item',
        details: error.toString()
      },
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
