import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function WardrobePage() {
  // TODO: Fetch from Supabase
  const items: any[] = []

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Wardrobe</h1>
          <p className="text-muted-foreground">
            {items.length} items in your collection
          </p>
        </div>
        <Link href="/upload">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">👔</div>
          <h2 className="text-2xl font-semibold mb-2">Your wardrobe is empty</h2>
          <p className="text-muted-foreground mb-6">
            Start by uploading some clothing items
          </p>
          <Link href="/upload">
            <Button size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Upload First Item
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-muted rounded-md mb-3"></div>
              <h3 className="font-semibold">{item.type}</h3>
              <p className="text-sm text-muted-foreground">{item.colors.join(', ')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
