"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const events = [
  { id: "work", name: "Work", icon: "💼", formality: "business_casual" },
  { id: "interview", name: "Job Interview", icon: "🎯", formality: "formal" },
  { id: "date", name: "Date Night", icon: "💕", formality: "smart_casual" },
  { id: "casual", name: "Casual Outing", icon: "👕", formality: "casual" },
  { id: "party", name: "Party", icon: "🎉", formality: "smart_casual" },
  { id: "gym", name: "Gym/Workout", icon: "💪", formality: "athletic" },
  { id: "wedding", name: "Wedding", icon: "👰", formality: "formal" },
  { id: "outdoor", name: "Outdoor Activity", icon: "🏕️", formality: "casual" },
]

export default function SuggestPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(userData))
  }, [router])

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
          <h1 className="text-2xl md:text-4xl font-bold mb-2">What's the occasion?</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Select what you're dressing up for today
          </p>
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {events.map((event) => (
            <button
              key={event.id}
              className="p-4 md:p-6 border rounded-lg hover:border-primary hover:shadow-lg transition-all text-center group"
            >
              <div className="text-3xl md:text-4xl mb-2 md:mb-3">{event.icon}</div>
              <h3 className="font-semibold text-sm md:text-base mb-1">{event.name}</h3>
              <p className="text-xs text-muted-foreground capitalize">
                {event.formality.replace('_', ' ')}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-8 md:mt-12 p-4 md:p-6 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2 text-sm md:text-base">🤖 How it works</h3>
          <ol className="text-xs md:text-sm text-muted-foreground space-y-1">
            <li>1. Select your event type above</li>
            <li>2. Get 3 AI-powered outfit combinations</li>
            <li>3. Choose your favorite for today</li>
            <li>4. We'll track it to avoid repeating soon</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
