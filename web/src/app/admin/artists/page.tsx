'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';
import { getMediaUrl } from '@/lib/media-utils';

interface Artist {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  verified: boolean;
  follower_count: number;
  genres: string[] | null;
  created_at: string;
}

export default function ArtistsManagement() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);

  useEffect(() => {
    fetchArtists();
  }, [page, search]);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Not authenticated');
        return;
      }

      const url = new URL('/api/admin/artists', window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', '20');
      if (search) url.searchParams.set('search', search);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch artists');
      }

      const data = await response.json();
      setArtists(data.artists);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (artistId: string) => {
    if (!confirm('Are you sure you want to delete this artist?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/artists/${artistId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete artist');
      }

      fetchArtists();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Artists</h1>
            <p className="text-gray-400 mt-1">
              Manage artists and their content
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#ff4a14] hover:bg-[#d43e11] text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + Add Artist
          </button>
        </div>

        {/* Search */}
        <div className="bg-gray-800 rounded-lg p-4">
          <input
            type="text"
            placeholder="Search artists..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4a14]"
          />
        </div>

        {/* Artists Table */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <>
            {artists.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">🎤</div>
                <h3 className="text-white text-xl font-bold mb-2">No artists yet</h3>
                <p className="text-gray-400 mb-4">
                  {search ? 'No artists match your search' : 'Get started by adding your first artist'}
                </p>
                {!search && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#ff4a14] hover:bg-[#d43e11] text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    + Add Artist
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Artist
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Verified
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Followers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {artists.map((artist) => (
                      <tr key={artist.id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-xl">
                              {artist.avatar_url && getMediaUrl(artist.avatar_url) ? (
                                <img
                                  src={getMediaUrl(artist.avatar_url)!}
                                  alt={artist.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                '🎤'
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {artist.name}
                              </p>
                              {artist.bio && (
                                <p className="text-sm text-gray-400 truncate max-w-md">
                                  {artist.bio}
                                </p>
                              )}
                              {artist.genres && artist.genres.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {artist.genres.slice(0, 3).map((genreId, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded"
                                    >
                                      {genreId}
                                    </span>
                                  ))}
                                  {artist.genres.length > 3 && (
                                    <span className="text-xs text-gray-500">
                                      +{artist.genres.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {artist.verified ? (
                            <span className="text-[#ff5c2e]">✓ Verified</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-white">
                          {(artist.follower_count || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {new Date(artist.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => setEditingArtist(artist)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(artist.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg"
              >
                Previous
              </button>
              <span className="text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || editingArtist) && (
          <ArtistModal
            artist={editingArtist}
            onClose={() => {
              setShowCreateModal(false);
              setEditingArtist(null);
            }}
            onSuccess={() => {
              setShowCreateModal(false);
              setEditingArtist(null);
              fetchArtists();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface ArtistModalProps {
  artist: Artist | null;
  onClose: () => void;
  onSuccess: () => void;
}

function ArtistModal({ artist, onClose, onSuccess }: ArtistModalProps) {
  const [formData, setFormData] = useState({
    name: artist?.name || '',
    bio: artist?.bio || '',
    verified: artist?.verified || false,
    genres: artist?.genres || [] as string[],
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/genres?limit=1000', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setGenres(data.genres || []);
      }
    } catch (error) {
      console.error('Failed to fetch genres:', error);
    }
  };

  const toggleGenre = (genreId: string) => {
    const newGenres = formData.genres.includes(genreId)
      ? formData.genres.filter(g => g !== genreId)
      : [...formData.genres, genreId];
    setFormData({ ...formData, genres: newGenres });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const url = artist
        ? `/api/admin/artists/${artist.id}`
        : '/api/admin/artists';
      const method = artist ? 'PUT' : 'POST';

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('bio', formData.bio);
      submitData.append('verified', formData.verified.toString());
      if (avatarFile) submitData.append('avatar', avatarFile);
      if (coverFile) submitData.append('cover', coverFile);

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save artist');
      }

      onSuccess();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">
          {artist ? 'Edit Artist' : 'Create Artist'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4a14]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              rows={3}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4a14]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Avatar Image
            </label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4a14] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#ff4a14] file:text-white hover:file:bg-[#d43e11]"
            />
            {artist?.avatar_url && (
              <p className="text-xs text-gray-400 mt-1">
                Current: {artist.avatar_url}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Cover Image
            </label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4a14] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#ff4a14] file:text-white hover:file:bg-[#d43e11]"
            />
            {artist?.cover_image_url && (
              <p className="text-xs text-gray-400 mt-1">
                Current: {artist.cover_image_url}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Genres
            </label>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-gray-700 rounded-lg">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => toggleGenre(genre.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    formData.genres.includes(genre.id)
                      ? 'bg-[#ff4a14] text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="verified"
              checked={formData.verified}
              onChange={(e) =>
                setFormData({ ...formData, verified: e.target.checked })
              }
              className="w-4 h-4"
            />
            <label htmlFor="verified" className="text-sm text-gray-300">
              Verified Artist
            </label>
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#ff4a14] hover:bg-[#d43e11] disabled:opacity-50 text-white px-4 py-2 rounded-lg"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
