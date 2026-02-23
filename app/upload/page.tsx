"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Upload, Camera, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function UploadPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(userData))
  }, [router])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      console.log('[UPLOAD UI] No file selected')
      return
    }

    console.log('[UPLOAD UI] ========== START UPLOAD FLOW ==========')
    console.log('[UPLOAD UI] File:', {
      name: file.name,
      size: file.size,
      type: file.type
    })
    console.log('[UPLOAD UI] User email:', user?.email)

    setUploading(true)

    try {
      // 1. Upload to Supabase Storage
      // First get the actual user ID from database
      console.log('[UPLOAD UI] Step 1: Fetching user ID...')
      const userRes = await fetch(`/api/user?email=${encodeURIComponent(user?.email)}`)
      
      if (!userRes.ok) {
        console.error('[UPLOAD UI] User fetch failed:', userRes.status, userRes.statusText)
        throw new Error('Failed to get user ID')
      }
      
      const userData = await userRes.json()
      console.log('[UPLOAD UI] Step 1: ✓ User ID:', userData.userId)

      console.log('[UPLOAD UI] Step 2: Uploading to Supabase Storage...')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userData.userId || user?.email || 'anonymous')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text()
        console.error('[UPLOAD UI] Upload failed:', uploadRes.status, errorText)
        throw new Error('Upload failed')
      }

      const uploadData = await uploadRes.json()
      console.log('[UPLOAD UI] Step 2: ✓ Upload successful')
      console.log('[UPLOAD UI] Image URL:', uploadData.imageUrl)

      // 2. Convert image to base64 for OpenAI analysis
      console.log('[UPLOAD UI] Step 3: Converting image to base64...')
      const reader = new FileReader()
      reader.readAsDataURL(file)
      
      reader.onload = async () => {
        try {
          const base64Full = reader.result?.toString()
          console.log('[UPLOAD UI] Step 3: ✓ Base64 conversion complete')
          console.log('[UPLOAD UI] Base64 length:', base64Full?.length || 0)
          
          const base64 = base64Full?.split(',')[1]
          console.log('[UPLOAD UI] Base64 data (no prefix) length:', base64?.length || 0)

          if (!base64) {
            console.error('[UPLOAD UI] ✗ FAIL: No base64 data generated')
            throw new Error('Failed to convert image to base64')
          }

          // 3. Analyze with OpenAI GPT-4o
          console.log('[UPLOAD UI] Step 4: Sending to /api/analyze...')
          const analyzePayload = { imageBase64: base64 }
          console.log('[UPLOAD UI] Payload size:', JSON.stringify(analyzePayload).length, 'bytes')
          
          const analyzeRes = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(analyzePayload),
          })

          console.log('[UPLOAD UI] Analysis response status:', analyzeRes.status, analyzeRes.statusText)

          if (!analyzeRes.ok) {
            const errorData = await analyzeRes.text()
            console.error('[UPLOAD UI] ✗ FAIL: Analysis failed')
            console.error('[UPLOAD UI] Error response:', errorData)
            throw new Error(`Analysis failed: ${errorData}`)
          }

          const analyzeData = await analyzeRes.json()
          console.log('[UPLOAD UI] Step 4: ✓ Analysis complete')
          console.log('[UPLOAD UI] Analysis response:', analyzeData)

          const analysis = analyzeData.data
          console.log('[UPLOAD UI] Parsed analysis:', analysis)

          // 4. Save each clothing item to database
          console.log('[UPLOAD UI] Step 5: Validating analysis results...')
          
          if (!analysis.items || analysis.items.length === 0) {
            console.error('[UPLOAD UI] ✗ FAIL: No clothing items detected')
            console.error('[UPLOAD UI] Analysis object:', analysis)
            throw new Error('No clothing items detected in the image')
          }

          console.log('[UPLOAD UI] Step 5: ✓ Found', analysis.items.length, 'items to save')
          console.log('[UPLOAD UI] Items:', analysis.items.map((i: any) => i.name || i.type))

          // Step 5.5: Segment each item (remove background for each clothing piece)
          console.log('[UPLOAD UI] Step 5.5: Segmenting individual items...')
          const segmentedItems = await Promise.all(
            analysis.items.map(async (item: any, index: number) => {
              console.log(`[UPLOAD UI] Segmenting item ${index + 1}/${analysis.items.length}: ${item.name}`)
              
              try {
                const segmentRes = await fetch('/api/segment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    imageBase64: base64,
                    itemName: item.name || item.type,
                  }),
                })

                if (!segmentRes.ok) {
                  console.warn(`[UPLOAD UI] Segmentation failed for ${item.name}, using original`)
                  return { item, segmentedBase64: base64, segmented: false }
                }

                const segmentData = await segmentRes.json()
                console.log(`[UPLOAD UI] ✓ Item ${index + 1} segmented:`, segmentData.segmented ? 'YES' : 'NO')
                
                return {
                  item,
                  segmentedBase64: segmentData.imageBase64,
                  segmented: segmentData.segmented || false,
                }
              } catch (err) {
                console.error(`[UPLOAD UI] Segmentation error for ${item.name}:`, err)
                return { item, segmentedBase64: base64, segmented: false }
              }
            })
          )

          console.log('[UPLOAD UI] Step 5.5: ✓ All items segmented')
          console.log('[UPLOAD UI] Segmented count:', segmentedItems.filter(i => i.segmented).length)

          console.log('[UPLOAD UI] Step 6: Uploading segmented images...')
          
          // Upload each segmented image to storage
          const uploadPromises = segmentedItems.map(async ({ item, segmentedBase64, segmented }, index) => {
            console.log(`[UPLOAD UI] Uploading item ${index + 1}/${segmentedItems.length}:`, item.name)
            
            // Convert segmented base64 back to blob for upload
            const byteString = atob(segmentedBase64)
            const ab = new ArrayBuffer(byteString.length)
            const ia = new Uint8Array(ab)
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i)
            }
            const blob = new Blob([ab], { type: segmented ? 'image/png' : 'image/jpeg' })
            
            // Create unique filename for this item
            const timestamp = Date.now()
            const itemSlug = (item.name || item.type).toLowerCase().replace(/\s+/g, '-')
            const ext = segmented ? 'png' : 'jpg'
            const itemFile = new File([blob], `${itemSlug}-${timestamp}.${ext}`, {
              type: segmented ? 'image/png' : 'image/jpeg'
            })

            // Upload this specific item image
            const itemFormData = new FormData()
            itemFormData.append('file', itemFile)
            itemFormData.append('userId', userData.userId)

            const itemUploadRes = await fetch('/api/upload', {
              method: 'POST',
              body: itemFormData,
            })

            if (!itemUploadRes.ok) {
              console.error(`[UPLOAD UI] Upload failed for ${item.name}`)
              throw new Error(`Failed to upload ${item.name}`)
            }

            const itemUploadData = await itemUploadRes.json()
            console.log(`[UPLOAD UI] ✓ Item ${index + 1} uploaded:`, itemUploadData.imageUrl)

            return {
              item,
              imageUrl: itemUploadData.imageUrl,
              segmented,
            }
          })

          const uploadedItems = await Promise.all(uploadPromises)
          console.log('[UPLOAD UI] Step 6: ✓ All segmented images uploaded')

          console.log('[UPLOAD UI] Step 7: Saving items to database...')
          
          // Save each item with its own image URL
          const savePromises = uploadedItems.map((uploaded, index) => {
            const itemData = {
              userEmail: user?.email,
              imageUrl: uploaded.imageUrl,
              analysis: {
                name: uploaded.item.name,
                type: uploaded.item.type,
                subtype: uploaded.item.name, // Use specific name as subtype
                colors: uploaded.item.colors,
                pattern: uploaded.item.pattern,
                season: uploaded.item.season,
                formality: uploaded.item.formality,
                tags: uploaded.item.tags,
              },
            }
            
            console.log(`[UPLOAD UI] Saving item ${index + 1}/${uploadedItems.length}:`, uploaded.item.name)
            
            return fetch('/api/clothing', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(itemData),
            })
          })

          const saveResults = await Promise.all(savePromises)
          console.log('[UPLOAD UI] All save requests completed')
          
          const failedSaves = saveResults.filter(res => !res.ok)
          if (failedSaves.length > 0) {
            console.error('[UPLOAD UI] ✗ FAIL: Some saves failed:', failedSaves.length)
            for (let i = 0; i < saveResults.length; i++) {
              if (!saveResults[i].ok) {
                const errorText = await saveResults[i].text()
                console.error(`[UPLOAD UI] Item ${i + 1} save failed:`, errorText)
              }
            }
            throw new Error(`Failed to save ${failedSaves.length} item(s)`)
          }

          console.log('[UPLOAD UI] Step 7: ✓ All items saved successfully')
          console.log('[UPLOAD UI] Summary:', {
            totalItems: uploadedItems.length,
            segmented: uploadedItems.filter(i => i.segmented).length,
            original: uploadedItems.filter(i => !i.segmented).length,
          })
          console.log('[UPLOAD UI] ========== UPLOAD COMPLETE ==========')

          // Success!
          setUploading(false)
          router.push('/wardrobe')
        } catch (err: any) {
          console.error('[UPLOAD UI] ========== UPLOAD FAILED ==========')
          console.error('[UPLOAD UI] Error:', err)
          console.error('[UPLOAD UI] Error message:', err.message)
          console.error('[UPLOAD UI] Error stack:', err.stack)
          setUploading(false)
          alert(`Analysis failed: ${err.message}`)
        }
      }

      reader.onerror = (error) => {
        console.error('[UPLOAD UI] ========== FILE READ FAILED ==========')
        console.error('[UPLOAD UI] FileReader error:', error)
        setUploading(false)
        alert('Failed to read image')
      }
    } catch (error: any) {
      console.error('[UPLOAD UI] ========== UPLOAD ERROR ==========')
      console.error('[UPLOAD UI] Error:', error)
      console.error('[UPLOAD UI] Error message:', error.message)
      setUploading(false)
      alert(`Upload failed: ${error.message}`)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto p-4 md:p-6">
          <Link href="/wardrobe" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Wardrobe
          </Link>
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Add Clothing</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Upload a photo - I'll detect all clothing items automatically
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* File Upload */}
          <div className="border-2 border-dashed rounded-lg p-8 md:p-12 text-center hover:border-primary transition-colors">
            <Upload className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-base md:text-lg mb-2">Upload from Gallery</h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-4">
              Choose an image from your device
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button asChild disabled={uploading} className="w-full md:w-auto">
                <span>{uploading ? "Uploading..." : "Choose File"}</span>
              </Button>
            </label>
          </div>

          {/* Camera */}
          <div className="border-2 border-dashed rounded-lg p-8 md:p-12 text-center hover:border-primary transition-colors">
            <Camera className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-base md:text-lg mb-2">Take Photo</h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-4">
              Use your device camera
            </p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
              id="camera-upload"
            />
            <label htmlFor="camera-upload">
              <Button asChild variant="outline" disabled={uploading} className="w-full md:w-auto">
                <span>Open Camera</span>
              </Button>
            </label>
          </div>
        </div>

        <div className="mt-8 md:mt-12 p-4 md:p-6 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2 text-sm md:text-base">💡 Tips for best results</h3>
          <ul className="text-xs md:text-sm text-muted-foreground space-y-1">
            <li>• Upload individual items OR full outfit photos - I'll detect all items automatically</li>
            <li>• Use good lighting (natural light is best)</li>
            <li>• Ensure all items are clearly visible</li>
            <li>• Works with traditional wear too (kurta, sherwani, saree, etc.)</li>
            <li>• Avoid cluttered backgrounds for better accuracy</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
