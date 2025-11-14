# 🎵 Qoqnuz Music Streaming Platform

A modern, full-featured music streaming platform with social features, built with Next.js, Flutter, Supabase, and Cloudflare R2.

![Status](https://img.shields.io/badge/Status-Milestone%20A%20Complete-green)
![Next.js](https://img.shields.io/badge/Next.js-14.1-black)
![Flutter](https://img.shields.io/badge/Flutter-Coming%20Soon-blue)
![Supabase](https://img.shields.io/badge/Supabase-Powered-green)

---

## 🌟 Features

### Core Music Platform
- 🎵 **High-quality audio streaming** from Cloudflare R2
- 📀 **Albums, artists, tracks, playlists** with full metadata
- 🎚️ **Gapless playback**, queue management, shuffle, repeat
- 🔍 **Advanced search** with filters (artist/album/song/playlist)
- 📝 **Lyrics support** for all tracks

### Social Features
- 👥 **Follow users & artists** - Stay connected with your music community
- 📊 **Activity feed** - See what friends are listening to
- 🎶 **Public & collaborative playlists** - Create and share together
- 💬 **Comments & reactions** - Engage with music and users
- 📨 **Direct messaging** - Connect with other music lovers
- 📱 **User posts/feed** - Share your musical journey
- 🎉 **Group listening sessions** - Listen together in real-time

### Admin Portal
- 🎨 **Site-wide theme customization** - Control colors and branding
- ⬆️ **Music & artwork upload** - Manage your content library
- 👤 **User management** - Moderation and analytics
- ⚙️ **Configuration dashboard** - Supabase, R2, email settings
- 📊 **Analytics** - Streams, listeners, engagement trends
- 🔐 **Role-based access control** - Admin/Editor/Moderator roles

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- **Web**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Mobile**: Flutter (iOS & Android)

**Backend:**
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Realtime**: Supabase Realtime (for group sessions, messaging)
- **API**: Next.js API Routes + Supabase Edge Functions

**Storage:**
- **Media Files**: Cloudflare R2 (music, images)
- **Streaming**: Signed URLs with expiration

**Deployment:**
- **Web**: Ubuntu VPS (app.qoqnuz.com) / Vercel
- **Database**: Supabase Cloud
- **CDN**: Cloudflare

---

## 📁 Project Structure

```
qoqnuzmedia/
├── web/                          # Next.js web application
│   ├── src/
│   │   ├── app/                  # Next.js App Router pages
│   │   │   ├── api/             # API routes
│   │   │   ├── test/            # Test pages
│   │   │   └── ...              # Feature pages (coming in Milestone D)
│   │   ├── lib/                 # Utilities
│   │   │   ├── supabase.ts      # Supabase client
│   │   │   └── r2.ts            # Cloudflare R2 client
│   │   └── components/          # React components (coming)
│   ├── package.json
│   └── README.md
│
├── mobile/                       # Flutter mobile app (Milestone E)
│   └── (Coming soon)
│
├── supabase/                     # Database & backend
│   ├── migrations/              # Database schema migrations
│   │   └── 20250114000000_initial_schema.sql
│   └── seed.sql                 # Sample data for development
│
├── docs/                         # Documentation
│   ├── CLOUDFLARE_R2_SETUP.md  # R2 configuration guide
│   └── ...                      # Additional docs
│
├── setup-milestone-a.sh          # Automated setup script
├── VERIFICATION_CHECKLIST.md     # Milestone A verification
└── README.md                     # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Ubuntu/Debian Linux** server or VPS
- **Node.js 20.x** or higher
- **Supabase account** (free tier available)
- **Cloudflare account** with R2 enabled

### Quick Start

**1. Clone the repository:**

```bash
git clone <your-repo-url>
cd qoqnuzmedia
```

**2. Run the automated setup script:**

```bash
bash setup-milestone-a.sh
```

This script will:
- Install Node.js, pnpm, Supabase CLI, AWS CLI
- Set up the Next.js web app
- Guide you through configuration

**3. Configure your credentials:**

Edit `web/.env.local` with your Supabase and R2 credentials.

**4. Apply database schema:**

Copy `supabase/migrations/20250114000000_initial_schema.sql` to your Supabase SQL Editor and execute.

**5. Upload sample files to R2:**

Follow instructions in `docs/CLOUDFLARE_R2_SETUP.md`

**6. Start the development server:**

```bash
cd web
pnpm dev
```

**7. Test streaming:**

Visit http://localhost:3000/test

---

## 📚 Documentation

- **[Setup Guide](./setup-milestone-a.sh)** - Automated installation
- **[Verification Checklist](./VERIFICATION_CHECKLIST.md)** - Ensure everything works
- **[R2 Setup Guide](./docs/CLOUDFLARE_R2_SETUP.md)** - Cloudflare R2 configuration
- **[Web App README](./web/README.md)** - Next.js app documentation

---

## 🗺️ Development Roadmap

### ✅ Milestone A: Infrastructure & Foundation (COMPLETE)
- ✅ Supabase database schema (50+ tables)
- ✅ Cloudflare R2 storage setup
- ✅ Next.js web app foundation
- ✅ Music streaming API with signed URLs
- ✅ Sample data and test environment

### 🔄 Milestone B: Backend APIs & Authentication (Next)
- User registration and authentication
- Complete REST API for all features
- Playlist CRUD operations
- Social features APIs (follows, comments, reactions)
- Search and discovery endpoints

### 📋 Milestone C: Admin Portal
- Theme editor and customization
- Content upload and management
- User moderation tools
- Analytics dashboard
- System configuration UI

### 🎨 Milestone D: Web App (Pixel-Perfect UI)
- Landing page
- Search interface
- Artist, album, and playlist pages
- Music player UI with controls
- Library and collection pages
- Social feed and activity
- Responsive design

### 📱 Milestone E: Flutter Mobile App
- iOS and Android apps
- Complete feature parity with web
- Offline playback support
- Push notifications
- Mobile-optimized UI

### 🎉 Milestone F: Social Layer & Advanced Features
- Real-time messaging
- Group listening sessions
- Stories (Instagram-style)
- Advanced recommendations
- User-generated content

---

## 🗃️ Database Schema

The platform uses **50+ tables** including:

**Core:**
- `profiles` - User profiles
- `artists` - Artist information
- `albums` - Album catalog
- `tracks` - Music tracks
- `playlists` - User playlists

**Social:**
- `user_follows` - User relationships
- `artist_follows` - Artist subscriptions
- `comments` - Track/playlist comments
- `reactions` - Emoji reactions
- `messages` - Direct messaging
- `posts` - User feed posts

**Analytics:**
- `play_history` - Listening history
- `daily_track_stats` - Aggregated metrics
- `daily_artist_stats` - Artist analytics

**Admin:**
- `admin_roles` - RBAC roles
- `moderation_reports` - Content moderation
- `site_settings` - Configuration

[See complete schema](./supabase/migrations/20250114000000_initial_schema.sql)

---

## 🔐 Security Features

- **Row Level Security (RLS)** on all tables
- **Signed URLs** for media access (1-hour expiration)
- **JWT-based authentication** via Supabase
- **Role-based access control** for admin features
- **CORS policies** properly configured
- **Input validation** on all API endpoints

---

## 🎨 Design Philosophy

**Visually Distinct, Functionally Identical to Spotify**

We're building a platform that:
- ✅ Has all the features of Spotify
- ✅ Provides the same smooth UX
- ✅ Uses original branding and design (Qoqnuz theme)
- ✅ Is safe from copyright issues
- ✅ Is production-ready and scalable

**Brand Colors:**
- Primary: `#1DB954` (Green)
- Secondary: `#191414` (Dark)
- Background: `#121212` (Black)
- Surface: `#181818` (Dark Gray)

---

## 🧪 Testing

### Test Streaming (Milestone A)

Visit http://localhost:3000/test and use sample track IDs:

- `t3333333-3333-3333-3333-333333333331` - Maya Rivers - Golden
- `t1111111-1111-1111-1111-111111111111` - Luna Eclipse - Aurora
- `t2222222-2222-2222-2222-222222222222` - The Crimson Waves - Ocean Heart

---

## 📊 Performance Goals

- **Page load**: < 2 seconds
- **API response**: < 500ms
- **Audio start**: < 3 seconds
- **Database queries**: < 100ms (with proper indexing)
- **Concurrent users**: 10,000+ (with proper scaling)

---

## 🤝 Contributing

This is a proprietary project for Qoqnuz Music Platform.

---

## 📄 License

Proprietary - All rights reserved

---

## 📞 Support

For issues or questions:
- Check the [Verification Checklist](./VERIFICATION_CHECKLIST.md)
- Review [Documentation](./docs/)
- Check setup scripts

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend infrastructure
- [Cloudflare R2](https://www.cloudflare.com/products/r2/) - Object storage
- [Flutter](https://flutter.dev/) - Mobile framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

## 📈 Current Status

**Milestone A: Complete** ✅

- Infrastructure fully set up
- Database schema deployed
- Music streaming working
- Test environment ready

**Next: Milestone B** - Backend APIs & Authentication

---

**Built with ❤️ by Claude Code for Qoqnuz Music**

*Empowering music lovers worldwide* 🎵
