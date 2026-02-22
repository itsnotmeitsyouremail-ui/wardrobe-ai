# Wardrobe AI

AI-powered outfit recommendation web app built with Next.js 15, TypeScript, and shadcn/ui.

## Features

- 📸 Upload clothing items via camera or file
- 🤖 AI-powered clothing analysis (type, color, style, formality)
- 👔 Smart outfit suggestions based on events
- 💾 Personal wardrobe management
- 🎨 Beautiful UI with shadcn/ui components

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **AI:** Claude 3.5 Sonnet (Anthropic)
- **Database:** Supabase (PostgreSQL + Storage)
- **Deployment:** Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
wardrobe-ai/
├── app/              # Next.js App Router pages
│   ├── page.tsx     # Home page
│   ├── upload/      # Upload clothing
│   ├── wardrobe/    # Wardrobe view
│   └── suggest/     # Outfit suggestions
├── components/      # React components
│   └── ui/          # shadcn/ui components
├── lib/             # Utility functions
└── public/          # Static assets
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Development

Built by Fullstackr 🚀

## License

MIT
