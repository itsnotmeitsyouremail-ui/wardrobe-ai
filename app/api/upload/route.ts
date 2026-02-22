import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(request: NextRequest) {
  console.log('[UPLOAD] Starting upload process')
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    console.log('[UPLOAD] File received:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      userId
    })

    if (!file || !userId) {
      console.error('[UPLOAD] Missing required fields')
      return NextResponse.json(
        { error: 'File and userId required' },
        { status: 400 }
      )
    }

    // Upload to Supabase Storage (bucket: wardrobe-ai)
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    console.log('[UPLOAD] Uploading to Supabase bucket: wardrobe-ai, path:', fileName)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('wardrobe-ai')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('[UPLOAD] Supabase upload error:', uploadError)
      throw uploadError
    }

    console.log('[UPLOAD] Upload successful:', uploadData)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('wardrobe-ai')
      .getPublicUrl(fileName)

    console.log('[UPLOAD] Public URL generated:', urlData.publicUrl)

    return NextResponse.json({
      success: true,
      imageUrl: urlData.publicUrl,
      fileName,
    })
  } catch (error: any) {
    console.error('[UPLOAD] Fatal error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
