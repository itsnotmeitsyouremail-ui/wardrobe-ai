"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // TODO: Create user in DB via API
    // For now, just store in localStorage and redirect
    localStorage.setItem("user", JSON.stringify({ email, name }))
    
    setTimeout(() => {
      router.push("/wardrobe")
    }, 500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Wardrobe AI</h1>
          <p className="text-muted-foreground">
            Your smart outfit assistant
          </p>
        </div>

        <div className="border rounded-lg p-6 md:p-8 bg-card">
          <h2 className="text-2xl font-semibold mb-6">Sign In</h2>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Name
              </label>
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Email
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Continue"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Simple login - just for demo purposes
          </p>
        </div>
      </div>
    </div>
  )
}
