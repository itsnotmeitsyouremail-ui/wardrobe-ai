"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Camera } from "lucide-react"

export default function UploadPage() {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    // TODO: Upload to Supabase Storage + Claude analysis
    setTimeout(() => setUploading(false), 2000)
  }

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <h1 className="text-4xl font-bold mb-2">Upload Clothing</h1>
      <p className="text-muted-foreground mb-8">
        Take a photo or upload an image of a clothing item
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* File Upload */}
        <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Upload from Device</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Choose an image from your gallery
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button asChild disabled={uploading}>
              <span>{uploading ? "Uploading..." : "Choose File"}</span>
            </Button>
          </label>
        </div>

        {/* Camera */}
        <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors">
          <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Take Photo</h3>
          <p className="text-sm text-muted-foreground mb-4">
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
            <Button asChild variant="outline" disabled={uploading}>
              <span>Open Camera</span>
            </Button>
          </label>
        </div>
      </div>

      <div className="mt-12 p-6 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">💡 Tips for best results</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Use good lighting (natural light is best)</li>
          <li>• Lay the item flat or hang it</li>
          <li>• Ensure the entire item is visible</li>
          <li>• Avoid cluttered backgrounds</li>
        </ul>
      </div>
    </div>
  )
}
