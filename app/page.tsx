import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-6xl font-bold tracking-tight">
          Wardrobe AI
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Upload your clothes, get AI-powered outfit recommendations for any occasion.
        </p>
        
        <div className="flex gap-4 mt-8">
          <Link href="/upload">
            <Button size="lg">
              Upload Clothes
            </Button>
          </Link>
          <Link href="/wardrobe">
            <Button size="lg" variant="outline">
              View Wardrobe
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
          <div className="p-6 rounded-lg border bg-card text-card-foreground">
            <h3 className="font-semibold text-lg mb-2">📸 Upload</h3>
            <p className="text-sm text-muted-foreground">
              Take photos of your clothes or upload from gallery
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card text-card-foreground">
            <h3 className="font-semibold text-lg mb-2">🤖 AI Analysis</h3>
            <p className="text-sm text-muted-foreground">
              AI automatically tags type, color, style, and formality
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card text-card-foreground">
            <h3 className="font-semibold text-lg mb-2">✨ Get Outfits</h3>
            <p className="text-sm text-muted-foreground">
              Receive 3 AI-suggested combinations for your event
            </p>
          </div>
        </div>
      </main>

      <footer className="mt-auto text-sm text-muted-foreground">
        Built with Next.js 15 + shadcn/ui
      </footer>
    </div>
  );
}
