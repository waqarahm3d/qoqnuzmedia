'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';

interface Album {
  id: string;
  title: string;
  artist_id: string;
  cover_art_url: string | null;
  release_date: string;
  total_tracks: number;
  genres: string[] | null;
  description: string | null;
  created_at: string;
  artists?: {
    name: string;
  };
}

interface Artist {
  id: string;
  name: string;
}

interface Track {
  id: string;
  title: string;
  duration_ms: number;
  artists: {
    name: string;
  };
}

interface Genre {
  id: string;
  name: string;
}

export default function AlbumsPage() {
  const searchParams = useSearchParams();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

  useEffect(() => {
    fetchAlbums();

    // Check if we're coming from tracks page with selected tracks
    const createParam = searchParams?.get('create');
    const tracksParam = searchParams?.get('tracks');
    if (createParam === 'true' && tracksParam) {
      setShowCreateModal(true);
    }
  }, [page, search]);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Not authenticated');
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/albums?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch albums');
      }

      const data = await response.json();
      setAlbums(data.albums || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this album?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/albums/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        fetchAlbums();
      }
    } catch (error) {
      console.error('Failed to delete album:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Albums</h1>
            <p className="text-gray-400 mt-1">Manage albums on the platform</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + Create Album
          </button>
        </div>

        {/* Search */}
        <div className="bg-gray-800 rounded-lg p-4">
          <input
            type="text"
            placeholder="Search albums..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-600 text-red-200 p-4 rounded-lg">
            <p className="font-bold mb-2">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💿</div>
            <div className="text-gray-400">Loading albums...</div>
          </div>
        )}

        {/* Albums Grid */}
        {!loading && !error && (
          <>
            {albums.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">💿</div>
                <h3 className="text-white text-xl font-bold mb-2">
                  No albums found
                </h3>
                <p className="text-gray-400 mb-4">
                  {search
                    ? 'Try a different search term'
                    : 'Get started by creating your first album'}
                </p>
                {!search && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    + Create Album
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {albums.map((album) => (
                  <div
                    key={album.id}
                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-all group relative"
                  >
                    {/* Album Cover */}
                    <div className="relative mb-3">
                      {album.cover_art_url ? (
                        <img
                          src={album.cover_art_url}
                          alt={album.title}
                          className="w-full aspect-square object-cover rounded"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-gray-700 rounded flex items-center justify-center text-5xl">
                          💿
                        </div>
                      )}
                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black bg-opacity-75 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingAlbum(album)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(album.id)}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Album Info */}
                    <h3 className="text-white font-medium text-sm truncate mb-1">
                      {album.title}
                    </h3>
                    <p className="text-gray-400 text-xs truncate mb-1">
                      {album.artists?.name || 'Unknown Artist'}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {album.total_tracks} tracks
                      {album.release_date &&
                        ` • ${new Date(album.release_date).getFullYear()}`}
                    </p>
                    {album.genres && album.genres.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {album.genres.slice(0, 2).map((genre, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-white">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || editingAlbum) && (
          <AlbumModal
            album={editingAlbum}
            onClose={() => {
              setShowCreateModal(false);
              setEditingAlbum(null);
            }}
            onSuccess={() => {
              setShowCreateModal(false);
              setEditingAlbum(null);
              fetchAlbums();
            }}
            preselectedTracks={searchParams?.get('tracks')?.split(',') || []}
          />
        )}
      </div>
    </AdminLayout>
  );
}

interface AlbumModalProps {
  album: Album | null;
  onClose: () => void;
  onSuccess: () => void;
  preselectedTracks?: string[];
}

function AlbumModal({
  album,
  onClose,
  onSuccess,
  preselectedTracks = [],
}: AlbumModalProps) {
  const [formData, setFormData] = useState({
    title: album?.title || '',
    artist_id: album?.artist_id || '',
    description: album?.description || '',
    cover_art_url: album?.cover_art_url || '',
    release_date: album?.release_date || new Date().toISOString().split('T')[0],
    genres: album?.genres || [] as string[],
    album_type: 'album',
  });
  const [loading, setLoading] = useState(false);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<string[]>(
    preselectedTracks
  );
  const [genres, setGenres] = useState<Genre[]>([]);

  useEffect(() => {
    fetchArtists();
    fetchTracks();
    fetchGenres();
  }, []);

  const fetchArtists = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/artists?limit=1000', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setArtists(data.artists || []);
      }
    } catch (error) {
      console.error('Failed to fetch artists:', error);
    }
  };

  const fetchTracks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/tracks?limit=1000', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTracks(data.tracks || []);
      }
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
    }
  };

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
      ? formData.genres.filter((g) => g !== genreId)
      : [...formData.genres, genreId];
    setFormData({ ...formData, genres: newGenres });
  };

  const toggleTrack = (trackId: string) => {
    setSelectedTracks((prev) =>
      prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const url = album
        ? `/api/admin/albums/${album.id}`
        : '/api/admin/albums';
      const method = album ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...formData,
          cover_image_url: formData.cover_art_url,
          selectedTracks: selectedTracks,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save album');
      }

      onSuccess();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg p-6 max-w-3xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-4">
          {album ? 'Edit Album' : 'Create Album'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-gray-300 mb-2">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Artist *</label>
              <select
                required
                value={formData.artist_id}
                onChange={(e) =>
                  setFormData({ ...formData, artist_id: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
              >
                <option value="">Select Artist</option>
                {artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Release Date</label>
              <input
                type="date"
                value={formData.release_date}
                onChange={(e) =>
                  setFormData({ ...formData, release_date: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-gray-300 mb-2">Cover Art URL</label>
              <input
                type="url"
                value={formData.cover_art_url}
                onChange={(e) =>
                  setFormData({ ...formData, cover_art_url: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-gray-300 mb-2">Genres</label>
              <div className="flex flex-wrap gap-2 p-2 bg-gray-700 rounded-lg max-h-32 overflow-y-auto">
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => toggleGenre(genre.id)}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      formData.genres.includes(genre.id)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-gray-300 mb-2">
                Tracks ({selectedTracks.length} selected)
              </label>
              <div className="bg-gray-700 rounded-lg p-3 max-h-64 overflow-y-auto">
                {tracks.length === 0 ? (
                  <p className="text-gray-400 text-sm">No tracks available</p>
                ) : (
                  tracks.map((track) => (
                    <label
                      key={track.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-600 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTracks.includes(track.id)}
                        onChange={() => toggleTrack(track.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">
                          {track.title}
                        </p>
                        <p className="text-gray-400 text-xs truncate">
                          {track.artists?.name}
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : album ? 'Update Album' : 'Create Album'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
