# Qoqnuz Music - Web Application

Modern music streaming platform built with Next.js 14, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, Database, Realtime)
- **Storage**: Cloudflare R2
- **Deployment**: Vercel / Ubuntu VPS

## Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase project (created in setup)
- Cloudflare R2 bucket (configured in setup)

## Getting Started

### 1. Install Dependencies

```bash
cd web
npm install
# or
pnpm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=qoqnuz-media
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# App
NEXT_PUBLIC_APP_URL=https://app.qoqnuz.com
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Test Streaming

Visit [http://localhost:3000/test](http://localhost:3000/test) to test the streaming functionality.

## Project Structure

```
web/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   │   └── stream/     # Music streaming endpoint
│   │   ├── test/           # Test page for Milestone A
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Homepage
│   │   └── globals.css     # Global styles
│   └── lib/                # Utility libraries
│       ├── supabase.ts     # Supabase client
│       └── r2.ts           # Cloudflare R2 client
├── public/                 # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## API Routes

### `GET /api/stream/[trackId]`

Generate a signed URL for streaming a track.

**Parameters:**
- `trackId` - UUID of the track to stream

**Response:**
```json
{
  "streamUrl": "https://...",
  "track": {
    "id": "uuid",
    "title": "Song Title",
    "artist": "Artist Name"
  }
}
```

## Deployment

### Option 1: Vercel (Recommended for Web)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Option 2: Ubuntu VPS (Your Current Setup)

See `../docs/DEPLOYMENT_GUIDE.md` for detailed instructions.

## Next Milestones

- **Milestone B**: Backend APIs & Authentication
- **Milestone C**: Admin Portal
- **Milestone D**: Full Web UI (Pixel-Perfect)
- **Milestone E**: Flutter Mobile App
- **Milestone F**: Social Features

## License

Proprietary - Qoqnuz Music Platform
