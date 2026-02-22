"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("user")
    if (user) {
      router.push("/wardrobe")
    }
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <main className="flex flex-col items-center gap-6 md:gap-8 text-center max-w-4xl w-full">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Wardrobe AI
        </h1>
        <p className="text-base md:text-xl text-muted-foreground max-w-2xl px-4">
          Upload your clothes, get AI-powered outfit recommendations for any occasion.
        </p>
        
        <Link href="/login" className="mt-4">
          <Button size="lg" className="text-base">
            Get Started
          </Button>
        </Link>

        <div className="mt-8 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 w-full px-4">
          <div className="p-4 md:p-6 rounded-lg border bg-card text-card-foreground">
            <h3 className="font-semibold text-base md:text-lg mb-2">📸 Upload</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              Take photos of your clothes or upload from gallery
            </p>
          </div>
          <div className="p-4 md:p-6 rounded-lg border bg-card text-card-foreground">
            <h3 className="font-semibold text-base md:text-lg mb-2">🤖 AI Analysis</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              AI automatically tags type, color, style, and formality
            </p>
          </div>
          <div className="p-4 md:p-6 rounded-lg border bg-card text-card-foreground">
            <h3 className="font-semibold text-base md:text-lg mb-2">✨ Daily Outfits</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              Get 3 suggestions daily, never repeat the same outfit
            </p>
          </div>
        </div>
      </main>

      <footer className="mt-auto text-xs md:text-sm text-muted-foreground">
        Built with Next.js 15 + shadcn/ui
      </footer>
    </div>
  )
}
