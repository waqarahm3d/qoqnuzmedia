/**
 * Qoqnuz Music - Home Page
 * Milestone A: Simple landing page
 */

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black">
      <div className="max-w-6xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Qoqnuz Music
          </h1>
          <p className="text-2xl text-gray-300">
            Stream Your Soundtrack
          </p>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <p className="text-xl text-gray-400 mb-8">
            Modern music streaming platform with social features
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/test"
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold transition"
            >
              Test Streaming (Milestone A)
            </Link>
            <button className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-semibold transition">
              Sign Up (Coming Soon)
            </button>
          </div>
        </div>

        {/* Milestone Status */}
        <div className="bg-gray-800 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-green-400">
            ✅ Milestone A: Infrastructure & Foundation
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 text-lg">Completed:</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Supabase database schema (50+ tables)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Cloudflare R2 storage setup</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Next.js app with TypeScript</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Music streaming API with signed URLs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Seed data for testing</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-lg">Features Included:</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">→</span>
                  <span>User profiles & authentication</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">→</span>
                  <span>Artists, albums, tracks, playlists</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">→</span>
                  <span>Social features (follows, comments, reactions)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">→</span>
                  <span>Messaging & activity feed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">→</span>
                  <span>Analytics & admin portal</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-4xl mb-3">🎵</div>
            <h3 className="text-xl font-semibold mb-2">High-Quality Streaming</h3>
            <p className="text-gray-400">
              Lossless audio streaming from Cloudflare R2 with zero egress fees
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-xl font-semibold mb-2">Social Features</h3>
            <p className="text-gray-400">
              Follow friends, share playlists, and discover music together
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-xl font-semibold mb-2">Analytics</h3>
            <p className="text-gray-400">
              Track plays, listeners, and engagement with detailed analytics
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Technology Stack</h2>
          <div className="grid md:grid-cols-2 gap-4 text-gray-300">
            <div>
              <strong className="text-green-400">Frontend:</strong> Next.js 14, React, TypeScript, Tailwind CSS
            </div>
            <div>
              <strong className="text-green-400">Mobile:</strong> Flutter (iOS & Android)
            </div>
            <div>
              <strong className="text-green-400">Backend:</strong> Supabase (Auth, Database, Realtime)
            </div>
            <div>
              <strong className="text-green-400">Storage:</strong> Cloudflare R2
            </div>
            <div>
              <strong className="text-green-400">Database:</strong> PostgreSQL with Row-Level Security
            </div>
            <div>
              <strong className="text-green-400">Deployment:</strong> Vercel / Ubuntu VPS
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p>© 2025 Qoqnuz Music. Built with ❤️ for music lovers.</p>
        </div>
      </div>
    </div>
  );
}
