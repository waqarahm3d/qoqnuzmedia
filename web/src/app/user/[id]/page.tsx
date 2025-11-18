'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
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
  track_count: number;
}

export default function UserPage() {
  const params = useParams();
  const userId = params.id as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch public playlists
      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select('*')
        .eq('owner_id', userId)
        .eq('is_public', true)
        .order('updated_at', { ascending: false });

      if (playlistsError) throw playlistsError;
      setPlaylists(playlistsData || []);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-black mb-4">User Not Found</h1>
          <p className="text-gray-400 mb-6">
            This user could not be found.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[#ff4a14] text-white font-semibold rounded-full hover:bg-[#d43e11] transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end gap-6">
            {profile.avatar_url && getMediaUrl(profile.avatar_url) ? (
              <img
                src={getMediaUrl(profile.avatar_url)!}
                alt={profile.display_name || 'User'}
                className="w-52 h-52 rounded-full shadow-2xl object-cover"
              />
            ) : (
              <div className="w-52 h-52 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full shadow-2xl flex items-center justify-center text-8xl font-black">
                {profile.display_name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-bold uppercase mb-2">Profile</p>
              <h1 className="text-7xl font-black mb-6">
                {profile.display_name || 'Qoqnuz User'}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{playlists.length} Public Playlists</span>
                <span>•</span>
                <span>Joined {joinDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-8">
        {/* Bio */}
        {profile.bio && (
          <div className="mb-8 bg-gray-800/30 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-3">About</h2>
            <p className="text-gray-300">{profile.bio}</p>
          </div>
        )}

        {/* Public Playlists */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Public Playlists</h2>
          {playlists.length === 0 ? (
            <div className="text-center py-20 bg-gray-800/30 rounded-lg">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mx-auto mb-6 text-gray-600"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <h3 className="text-2xl font-bold mb-2">No public playlists</h3>
              <p className="text-gray-400">
                This user hasn't shared any playlists yet.
              </p>
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
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                        <svg
                          width="64"
                          height="64"
                          viewBox="0 0 24 24"
                          fill="white"
                          className="opacity-80"
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
