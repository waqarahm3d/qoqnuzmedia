'use client';

import { useState } from 'react';
import { createPlaylist } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CreatePlaylistPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter a playlist name');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const result = await createPlaylist(name, description || undefined);
      // Redirect to the new playlist
      if (result && (result as any).playlist?.id) {
        router.push(`/playlist/${(result as any).playlist.id}`);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create playlist');
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-black mb-4">Create Playlist</h1>
          <p className="text-gray-400">
            Create a new playlist to organize your favorite tracks
          </p>
        </div>

        {/* Form */}
        <div className="bg-gray-800/50 rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Playlist Cover Preview */}
            <div className="flex justify-center mb-6">
              <div className="w-48 h-48 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-2xl flex items-center justify-center">
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="opacity-90"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
            </div>

            {/* Playlist Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Playlist Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Playlist"
                maxLength={100}
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff5c2e]"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                {name.length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add an optional description"
                rows={4}
                maxLength={300}
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff5c2e] resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {description.length}/300 characters
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-900/30 text-red-400 border border-red-600 rounded-lg">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={creating || !name.trim()}
                className="flex-1 px-8 py-4 bg-[#ff4a14] text-white font-bold rounded-full hover:bg-[#d43e11] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {creating ? 'Creating...' : 'Create Playlist'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-4 bg-gray-700 text-white font-bold rounded-full hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Tips
          </h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Choose a descriptive name that reflects the mood or genre</li>
            <li>• You can add tracks to your playlist after creating it</li>
            <li>• Playlists can be made public or private in settings</li>
            <li>• You can edit the name and description anytime</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
