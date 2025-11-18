'use client';

import { useEffect, useState } from 'react';
import { getUserProfile, getUserPlaylists, getLikedTracks } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMediaUrl } from '@/lib/media-utils';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  is_public: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedCount, setLikedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const [profileData, playlistsData, likedData] = await Promise.all([
        getUserProfile(),
        getUserPlaylists(),
        getLikedTracks(),
      ]);
      setProfile(profileData);
      setPlaylists(playlistsData);
      setLikedCount(likedData.length);
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end gap-6">
            <div className="w-52 h-52 bg-gradient-to-br from-[#ff5c2e] to-blue-500 rounded-full shadow-2xl flex items-center justify-center text-8xl font-black">
              {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold uppercase mb-2">Profile</p>
              <h1 className="text-7xl font-black mb-6">
                {profile?.display_name || user?.email?.split('@')[0] || 'User'}
              </h1>
              <div className="flex items-center gap-4 text-sm">
                <span>{playlists.length} Public Playlists</span>
                <span>•</span>
                <span>{likedCount} Liked Songs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-8">
        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <Link
            href="/settings"
            className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform"
          >
            Edit Profile
          </Link>
          <button
            onClick={signOut}
            className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-full hover:bg-gray-700 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">About</h2>
            <p className="text-gray-400">{profile.bio}</p>
          </div>
        )}

        {/* Public Playlists */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Public Playlists</h2>
          {playlists.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/30 rounded-lg">
              <p className="text-gray-400 mb-4">No public playlists yet</p>
              <Link
                href="/playlist/create"
                className="inline-block px-6 py-3 bg-[#ff4a14] text-white font-semibold rounded-full hover:bg-[#d43e11] transition-colors"
              >
                Create Playlist
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {playlists.map((playlist) => (
                <Link
                  key={playlist.id}
                  href={`/playlist/${playlist.id}`}
                  className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-800 transition-all hover:scale-105 group"
                >
                  <div className="aspect-square bg-gray-700 rounded mb-4 overflow-hidden">
                    {playlist.cover_image_url && getMediaUrl(playlist.cover_image_url) ? (
                      <img
                        src={getMediaUrl(playlist.cover_image_url)!}
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          width="64"
                          height="64"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-gray-600"
                        >
                          <path d="M9 18V5l12-2v13" />
                          <circle cx="6" cy="18" r="3" />
                          <circle cx="18" cy="16" r="3" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold mb-1 truncate">{playlist.name}</h3>
                  <p className="text-sm text-gray-400 truncate">
                    {playlist.description || 'Playlist'}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
