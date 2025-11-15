'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Track {
  id: string;
  title: string;
  artist_id: string;
  album_id: string | null;
  duration_ms: number;
  play_count: number;
  cover_art_url: string | null;
  audio_url: string;
  explicit: boolean;
  genres: string[] | null;
  lyrics: string | null;
  created_at: string;
  artists?: {
    id: string;
    name: string;
  };
  albums?: {
    id: string;
    title: string;
    cover_art_url: string | null;
  };
}

interface Artist {
  id: string;
  name: string;
}

interface Album {
  id: string;
  title: string;
}

interface Genre {
  id: string;
  name: string;
}

export default function TracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    title: '',
    artist_id: '',
    album_id: '',
    audio_url: '',
    cover_art_url: '',
    duration_ms: 0,
    explicit: false,
    genres: [] as string[],
    lyrics: '',
    track_number: 1,
  });

  useEffect(() => {
    fetchTracks();
    fetchArtists();
    fetchGenres();
  }, [page, search]);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/tracks?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tracks');

      const data = await response.json();
      setTracks(data.tracks || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchArtists = async () => {
    try {
      const response = await fetch('/api/admin/artists?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setArtists(data.artists || []);
      }
    } catch (error) {
      console.error('Failed to fetch artists:', error);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await fetch('/api/admin/genres?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setGenres(data.genres || []);
      }
    } catch (error) {
      console.error('Failed to fetch genres:', error);
    }
  };

  const fetchAlbumsForArtist = async (artistId: string) => {
    try {
      const response = await fetch(`/api/admin/albums?artist_id=${artistId}&limit=1000`);
      if (response.ok) {
        const data = await response.json();
        setAlbums(data.albums || []);
      }
    } catch (error) {
      console.error('Failed to fetch albums:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTrack
        ? `/api/admin/tracks/${editingTrack.id}`
        : '/api/admin/tracks';
      const method = editingTrack ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          is_explicit: formData.explicit,
        }),
      });

      if (response.ok) {
        setShowUploadModal(false);
        setShowEditModal(false);
        setEditingTrack(null);
        resetForm();
        fetchTracks();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save track');
      }
    } catch (error) {
      console.error('Failed to save track:', error);
      setError('Failed to save track');
    }
  };

  const handleEdit = (track: Track) => {
    setEditingTrack(track);
    setFormData({
      title: track.title,
      artist_id: track.artist_id,
      album_id: track.album_id || '',
      audio_url: track.audio_url,
      cover_art_url: track.cover_art_url || '',
      duration_ms: track.duration_ms,
      explicit: track.explicit,
      genres: track.genres || [],
      lyrics: track.lyrics || '',
      track_number: 1,
    });
    if (track.artist_id) {
      fetchAlbumsForArtist(track.artist_id);
    }
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this track?')) return;

    try {
      const response = await fetch(`/api/admin/tracks/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchTracks();
      }
    } catch (error) {
      console.error('Failed to delete track:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      artist_id: '',
      album_id: '',
      audio_url: '',
      cover_art_url: '',
      duration_ms: 0,
      explicit: false,
      genres: [],
      lyrics: '',
      track_number: 1,
    });
  };

  const toggleTrackSelection = (trackId: string) => {
    const newSelection = new Set(selectedTracks);
    if (newSelection.has(trackId)) {
      newSelection.delete(trackId);
    } else {
      newSelection.add(trackId);
    }
    setSelectedTracks(newSelection);
  };

  const createAlbumFromSelected = () => {
    if (selectedTracks.size === 0) {
      alert('Please select tracks first');
      return;
    }
    // Navigate to albums page with selected tracks
    const trackIds = Array.from(selectedTracks).join(',');
    window.location.href = `/admin/albums?create=true&tracks=${trackIds}`;
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleArtistChange = (artistId: string) => {
    setFormData({ ...formData, artist_id: artistId, album_id: '' });
    if (artistId) {
      fetchAlbumsForArtist(artistId);
    } else {
      setAlbums([]);
    }
  };

  const toggleGenre = (genreId: string) => {
    const newGenres = formData.genres.includes(genreId)
      ? formData.genres.filter(g => g !== genreId)
      : [...formData.genres, genreId];
    setFormData({ ...formData, genres: newGenres });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Tracks</h1>
            <p className="text-gray-400">Manage tracks on the platform</p>
          </div>
          <div className="flex gap-2">
            {selectedTracks.size > 0 && (
              <button
                onClick={createAlbumFromSelected}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Album ({selectedTracks.size})
              </button>
            )}
            <button
              onClick={() => {
                resetForm();
                setShowUploadModal(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              + Upload Track
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-gray-800 rounded-lg p-4">
          <input
            type="text"
            placeholder="Search tracks..."
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
            <div className="text-6xl mb-4">🎵</div>
            <div className="text-gray-400">Loading tracks...</div>
          </div>
        )}

        {/* Tracks List */}
        {!loading && !error && (
          <>
            {tracks.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">🎵</div>
                <h3 className="text-white text-xl font-bold mb-2">
                  No tracks found
                </h3>
                <p className="text-gray-400 mb-4">
                  {search
                    ? 'Try a different search term'
                    : 'Get started by uploading your first track'}
                </p>
                {!search && (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    + Upload Track
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTracks(new Set(tracks.map(t => t.id)));
                            } else {
                              setSelectedTracks(new Set());
                            }
                          }}
                          checked={selectedTracks.size === tracks.length}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                        Track
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                        Artist
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                        Album
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">
                        Plays
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {tracks.map((track) => (
                      <tr key={track.id} className="hover:bg-gray-750">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedTracks.has(track.id)}
                            onChange={() => toggleTrackSelection(track.id)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {track.cover_art_url || track.albums?.cover_art_url ? (
                              <img
                                src={track.cover_art_url || track.albums?.cover_art_url || ''}
                                alt={track.title}
                                className="w-12 h-12 rounded mr-3 object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-700 rounded mr-3 flex items-center justify-center text-2xl">
                                🎵
                              </div>
                            )}
                            <div>
                              <div className="text-white font-medium flex items-center gap-2">
                                {track.title}
                                {track.explicit && (
                                  <span className="px-1.5 py-0.5 bg-gray-600 text-xs rounded">
                                    E
                                  </span>
                                )}
                              </div>
                              {track.genres && track.genres.length > 0 && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {track.genres.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-white">
                          {track.artists?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {track.albums?.title || '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {formatDuration(track.duration_ms)}
                        </td>
                        <td className="px-6 py-4 text-green-500 font-semibold">
                          {track.play_count?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleEdit(track)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(track.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
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

        {/* Upload/Edit Modal */}
        {(showUploadModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 my-8">
              <h2 className="text-2xl font-bold text-white mb-4">
                {editingTrack ? 'Edit Track' : 'Upload Track'}
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
                      placeholder="Enter track title"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Artist *</label>
                    <select
                      required
                      value={formData.artist_id}
                      onChange={(e) => handleArtistChange(e.target.value)}
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
                    <label className="block text-gray-300 mb-2">Album</label>
                    <select
                      value={formData.album_id}
                      onChange={(e) =>
                        setFormData({ ...formData, album_id: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                      disabled={!formData.artist_id}
                    >
                      <option value="">No Album (Single)</option>
                      {albums.map((album) => (
                        <option key={album.id} value={album.id}>
                          {album.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">
                      Audio URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={formData.audio_url}
                      onChange={(e) =>
                        setFormData({ ...formData, audio_url: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                      placeholder="https://..."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Upload audio file to cloud storage first
                    </p>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">
                      Cover Art URL
                    </label>
                    <input
                      type="url"
                      value={formData.cover_art_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cover_art_url: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">
                      Duration (seconds) *
                    </label>
                    <input
                      type="number"
                      required
                      value={Math.floor(formData.duration_ms / 1000)}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration_ms: parseInt(e.target.value) * 1000,
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">
                      Track Number
                    </label>
                    <input
                      type="number"
                      value={formData.track_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          track_number: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-gray-300 mb-2">Genres</label>
                    <div className="flex flex-wrap gap-2">
                      {genres.slice(0, 12).map((genre) => (
                        <button
                          key={genre.id}
                          type="button"
                          onClick={() => toggleGenre(genre.id)}
                          className={`px-3 py-1.5 rounded-full text-sm ${
                            formData.genres.includes(genre.id)
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {genre.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-gray-300 mb-2">Lyrics</label>
                    <textarea
                      value={formData.lyrics}
                      onChange={(e) =>
                        setFormData({ ...formData, lyrics: e.target.value })
                      }
                      rows={4}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                      placeholder="Optional: Add song lyrics"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center text-gray-300">
                      <input
                        type="checkbox"
                        checked={formData.explicit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            explicit: e.target.checked,
                          })
                        }
                        className="mr-2"
                      />
                      Explicit Content
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {editingTrack ? 'Update Track' : 'Upload Track'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setShowEditModal(false);
                      setEditingTrack(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
