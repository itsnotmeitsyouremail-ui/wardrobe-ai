"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Sparkles, LogOut } from "lucide-react"

export default function WardrobePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(userData))
    
    // TODO: Fetch items from Supabase
    // For now, empty
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto p-4 md:p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">My Wardrobe</h1>
            <p className="text-sm text-muted-foreground">
              {items.length} items
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-8">
        {items.length === 0 ? (
          <div className="text-center py-12 md:py-24">
            <div className="text-5xl md:text-6xl mb-4">👔</div>
            <h2 className="text-xl md:text-2xl font-semibold mb-2">Your wardrobe is empty</h2>
            <p className="text-sm md:text-base text-muted-foreground mb-6">
              Start by uploading your clothing items
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/upload">
                <Button size="lg" className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Clothes
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  You have {items.length} items in your wardrobe
                </p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Link href="/upload" className="flex-1 sm:flex-initial">
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add More
                  </Button>
                </Link>
                <Link href="/suggest" className="flex-1 sm:flex-initial">
                  <Button variant="outline" className="w-full">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Outfit
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {items.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 md:p-4 hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-muted rounded-md mb-3"></div>
                  <h3 className="font-semibold text-sm md:text-base">{item.type}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {item.colors.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
