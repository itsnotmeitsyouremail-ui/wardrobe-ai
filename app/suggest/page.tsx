import { Button } from "@/components/ui/button"

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
  return (
    <div className="container mx-auto max-w-4xl p-8">
      <h1 className="text-4xl font-bold mb-2">Get Outfit Suggestions</h1>
      <p className="text-muted-foreground mb-8">
        Select the type of event you're dressing for
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {events.map((event) => (
          <button
            key={event.id}
            className="p-6 border rounded-lg hover:border-primary hover:shadow-lg transition-all text-center group"
          >
            <div className="text-4xl mb-3">{event.icon}</div>
            <h3 className="font-semibold mb-1">{event.name}</h3>
            <p className="text-xs text-muted-foreground capitalize">
              {event.formality.replace('_', ' ')}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-12 p-6 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">🤖 How it works</h3>
        <ol className="text-sm text-muted-foreground space-y-1">
          <li>1. Select your event type above</li>
          <li>2. AI analyzes your wardrobe for suitable items</li>
          <li>3. Get 3 complete outfit suggestions with reasoning</li>
          <li>4. Choose your favorite or get more suggestions</li>
        </ol>
      </div>
    </div>
  )
}
