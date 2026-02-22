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
    if (!file) return

    setUploading(true)

    try {
      // 1. Upload to Supabase Storage
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', user?.email || 'anonymous')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        throw new Error('Upload failed')
      }

      const { imageUrl } = await uploadRes.json()

      // 2. Convert image to base64 for Claude analysis
      const reader = new FileReader()
      reader.readAsDataURL(file)
      
      reader.onload = async () => {
        try {
          const base64 = reader.result?.toString().split(',')[1]

          // 3. Analyze with Claude
          const analyzeRes = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64 }),
          })

          if (!analyzeRes.ok) {
            throw new Error('Analysis failed')
          }

          const { data: analysis } = await analyzeRes.json()

          // 4. Save to database
          const saveRes = await fetch('/api/clothing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmail: user?.email,
              imageUrl,
              analysis,
            }),
          })

          if (!saveRes.ok) {
            throw new Error('Failed to save item')
          }

          // Success!
          setUploading(false)
          router.push('/wardrobe')
        } catch (err) {
          console.error('Analysis error:', err)
          setUploading(false)
          alert('Analysis failed. Please try again.')
        }
      }

      reader.onerror = () => {
        setUploading(false)
        alert('Failed to read image')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploading(false)
      alert('Upload failed. Please try again.')
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
            Upload individual items (shirt, pants, shoes, etc.)
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
            <li>• Upload ONE item at a time (shirt, pants, shoes separately)</li>
            <li>• Use good lighting (natural light is best)</li>
            <li>• Lay the item flat or hang it</li>
            <li>• Ensure the entire item is visible</li>
            <li>• Avoid cluttered backgrounds</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
