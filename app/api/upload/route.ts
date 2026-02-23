import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('[UPLOAD API] ========== START UPLOAD ==========')
  console.log('[UPLOAD API] Timestamp:', new Date().toISOString())
  
  try {
    console.log('[UPLOAD API] Step 1: Parsing form data...')
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    console.log('[UPLOAD API] Step 1: ✓ Form data parsed')
    console.log('[UPLOAD API] File info:', {
      exists: !!file,
      name: file?.name,
      size: file?.size,
      type: file?.type,
    })
    console.log('[UPLOAD API] User ID:', userId)

    if (!file || !userId) {
      console.error('[UPLOAD API] ✗ FAIL: Missing required fields')
      console.error('[UPLOAD API] File exists:', !!file)
      console.error('[UPLOAD API] UserId exists:', !!userId)
      return NextResponse.json(
        { error: 'File and userId required' },
        { status: 400 }
      )
    }

    console.log('[UPLOAD API] Step 2: Preparing upload...')
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    console.log('[UPLOAD API] Upload details:', {
      bucket: 'wardrobe-ai',
      path: fileName,
      extension: fileExt
    })

    console.log('[UPLOAD API] Step 3: Uploading to Supabase Storage...')
    const uploadStart = Date.now()

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('wardrobe-ai')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    const uploadDuration = Date.now() - uploadStart

    if (uploadError) {
      console.error('[UPLOAD API] ✗ FAIL: Supabase upload error')
      console.error('[UPLOAD API] Error details:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        name: uploadError.name
      })
      console.error('[UPLOAD API] Full error object:', uploadError)
      throw uploadError
    }

    console.log('[UPLOAD API] Step 3: ✓ Upload successful in', uploadDuration, 'ms')
    console.log('[UPLOAD API] Upload data:', uploadData)

    console.log('[UPLOAD API] Step 4: Generating public URL...')
    const { data: urlData } = supabase.storage
      .from('wardrobe-ai')
      .getPublicUrl(fileName)

    console.log('[UPLOAD API] Step 4: ✓ Public URL generated')
    console.log('[UPLOAD API] URL:', urlData.publicUrl)

    const totalDuration = Date.now() - startTime
    console.log('[UPLOAD API] ========== UPLOAD COMPLETE ==========')
    console.log('[UPLOAD API] Total duration:', totalDuration, 'ms')

    return NextResponse.json({
      success: true,
      imageUrl: urlData.publicUrl,
      fileName,
    })
  } catch (error: any) {
    const totalDuration = Date.now() - startTime
    console.error('[UPLOAD API] ========== UPLOAD FAILED ==========')
    console.error('[UPLOAD API] Duration before error:', totalDuration, 'ms')
    console.error('[UPLOAD API] Error type:', error.constructor.name)
    console.error('[UPLOAD API] Error message:', error.message)
    console.error('[UPLOAD API] Error details:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'Upload failed',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}
