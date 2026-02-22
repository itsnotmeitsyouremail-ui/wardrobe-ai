import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface ClothingItem {
  id: string
  user_id: string
  image_url: string
  type: string
  subtype?: string
  colors: string[]
  pattern?: string
  season: string[]
  formality: string
  tags: string[]
  last_worn?: string
  clean: boolean
  created_at: string
  updated_at: string
}

export interface OutfitHistory {
  id: string
  user_id: string
  event_type: string
  items: {
    top?: string
    bottom?: string
    shoes?: string
    outerwear?: string
    accessories?: string[]
  }
  worn_at: string
  rating?: number
  notes?: string
}
