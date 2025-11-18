'use client';

import { useEffect, useState, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';
import { parseBlob } from 'music-metadata';

interface Artist {
  id: string;
  name: string;
}

interface Album {
  id: string;
  title: string;
  artist_id: string;
  cover_art_url: string | null;
}

interface Genre {
  id: string;
  name: string;
  slug: string;
}

interface TrackMetadata {
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverImage: string | null;
  year: number | null;
  genre: string[];
}

interface TrackUpload {
  file: File;
  metadata: TrackMetadata | null;
  title: string;
  artistId: string;
  albumId: string;
  selectedGenres: string[];
  tags: string;
  description: string;
  duration: number;
  explicit: boolean;
  releaseDate: string;
  coverImage: string | null;
  customCoverFile: File | null;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function TrackUploadPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [tracks, setTracks] = useState<TrackUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState('');

  // Bulk editing states
  const [bulkAlbumId, setBulkAlbumId] = useState('');
  const [bulkTags, setBulkTags] = useState('');
  const [bulkGenres, setBulkGenres] = useState<string[]>([]);
  const [bulkCoverImage, setBulkCoverImage] = useState<string | null>(null);
  const [bulkCoverFile, setBulkCoverFile] = useState<File | null>(null);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);

  // New album creation states
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumArtist, setNewAlbumArtist] = useState('');
  const [newAlbumReleaseDate, setNewAlbumReleaseDate] = useState('');
  const [newAlbumType, setNewAlbumType] = useState('album');
  const [creatingAlbum, setCreatingAlbum] = useState(false);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const bulkCoverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedArtistId) {
      fetchAlbumsForArtist(selectedArtistId);
      setNewAlbumArtist(selectedArtistId);
    } else {
      setAlbums([]);
    }
  }, [selectedArtistId]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const artistsRes = await fetch('/api/admin/artists?limit=1000', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (artistsRes.ok) {
        const artistsData = await artistsRes.json();
        setArtists(artistsData.artists || []);
      }

      const { data: genresData } = await supabase
        .from('genres')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');
      if (genresData) setGenres(genresData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const fetchAlbumsForArtist = async (artistId: string) => {
    try {
      const { data } = await supabase
        .from('albums')
        .select('id, title, artist_id, cover_art_url')
        .eq('artist_id', artistId)
        .order('release_date', { ascending: false });
      if (data) setAlbums(data);
    } catch (error) {
      console.error('Failed to fetch albums:', error);
    }
  };

  const handleCreateAlbum = async () => {
    if (!newAlbumTitle || !newAlbumArtist) {
      alert('Album title and artist are required');
      return;
    }

    setCreatingAlbum(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('title', newAlbumTitle);
      formData.append('artist_id', newAlbumArtist);
      formData.append('album_type', newAlbumType);
      if (newAlbumReleaseDate) formData.append('release_date', newAlbumReleaseDate);

      const response = await fetch('/api/admin/albums', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create album');
      }

      const result = await response.json();

      // Refresh albums list
      await fetchAlbumsForArtist(newAlbumArtist);

      // Set the new album as selected
      setBulkAlbumId(result.album.id);

      // Reset form
      setNewAlbumTitle('');
      setNewAlbumReleaseDate('');
      setShowCreateAlbum(false);

      alert('Album created successfully!');
    } catch (error: any) {
      console.error('Create album error:', error);
      alert(error.message || 'Failed to create album');
    } finally {
      setCreatingAlbum(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newTracks: TrackUpload[] = [];

    for (const file of files) {
      try {
        const metadata = await parseBlob(file);

        const extracted: TrackMetadata = {
          title: metadata.common.title || file.name.replace(/\.[^/.]+$/, ''),
          artist: metadata.common.artist || '',
          album: metadata.common.album || '',
          duration: metadata.format.duration || 0,
          coverImage: null,
          year: metadata.common.year || null,
          genre: metadata.common.genre || [],
        };

        let coverImageUrl: string | null = null;
        if (metadata.common.picture && metadata.common.picture.length > 0) {
          const picture = metadata.common.picture[0];
          const blob = new Blob([new Uint8Array(picture.data)], { type: picture.format });
          coverImageUrl = URL.createObjectURL(blob);
          extracted.coverImage = coverImageUrl;
        }

        // Try to match artist
        let matchedArtistId = selectedArtistId;
        if (extracted.artist && !selectedArtistId) {
          const matchedArtist = artists.find(
            a => a.name.toLowerCase() === extracted.artist.toLowerCase()
          );
          if (matchedArtist) {
            matchedArtistId = matchedArtist.id;
          }
        }

        newTracks.push({
          file,
          metadata: extracted,
          title: extracted.title,
          artistId: matchedArtistId,
          albumId: bulkAlbumId,
          selectedGenres: [...bulkGenres],
          tags: bulkTags,
          description: '',
          duration: Math.round(extracted.duration * 1000),
          explicit: false,
          releaseDate: extracted.year ? `${extracted.year}-01-01` : '',
          coverImage: bulkCoverImage || coverImageUrl,
          customCoverFile: bulkCoverFile,
          progress: 0,
          status: 'pending',
        });
      } catch (error) {
        console.error('Failed to extract metadata:', error);
        newTracks.push({
          file,
          metadata: null,
          title: file.name.replace(/\.[^/.]+$/, ''),
          artistId: selectedArtistId,
          albumId: bulkAlbumId,
          selectedGenres: [...bulkGenres],
          tags: bulkTags,
          description: '',
          duration: 0,
          explicit: false,
          releaseDate: '',
          coverImage: bulkCoverImage,
          customCoverFile: bulkCoverFile,
          progress: 0,
          status: 'pending',
        });
      }
    }

    setTracks(prev => [...prev, ...newTracks]);
  };

  const handleBulkCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkCoverFile(file);
    const imageUrl = URL.createObjectURL(file);
    setBulkCoverImage(imageUrl);

    // Apply to all existing pending tracks
    setTracks(prev => prev.map(track =>
      track.status === 'pending'
        ? { ...track, coverImage: imageUrl, customCoverFile: file }
        : track
    ));
  };

  const applyBulkSettings = () => {
    setTracks(prev => prev.map(track => {
      if (track.status !== 'pending') return track;

      return {
        ...track,
        albumId: bulkAlbumId || track.albumId,
        selectedGenres: bulkGenres.length > 0 ? [...bulkGenres] : track.selectedGenres,
        tags: bulkTags || track.tags,
        coverImage: bulkCoverImage || track.coverImage,
        customCoverFile: bulkCoverFile || track.customCoverFile,
      };
    }));

    alert('Bulk settings applied to all pending tracks!');
  };

  const handleBulkGenreToggle = (genreId: string) => {
    setBulkGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const updateTrack = (index: number, updates: Partial<TrackUpload>) => {
    setTracks(prev => prev.map((track, i) => i === index ? { ...track, ...updates } : track));
  };

  const removeTrack = (index: number) => {
    setTracks(prev => prev.filter((_, i) => i !== index));
  };

  const uploadSingleTrack = async (track: TrackUpload, index: number): Promise<boolean> => {
    try {
      updateTrack(index, { status: 'uploading', progress: 0 });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('audioFile', track.file);
      formData.append('title', track.title);
      formData.append('artistId', track.artistId);
      if (track.albumId) formData.append('albumId', track.albumId);
      formData.append('duration_ms', track.duration.toString());
      formData.append('explicit', track.explicit.toString());
      formData.append('description', track.description);
      formData.append('tags', track.tags);
      formData.append('releaseDate', track.releaseDate);
      formData.append('genreIds', JSON.stringify(track.selectedGenres));

      if (track.customCoverFile) {
        formData.append('coverImage', track.customCoverFile);
      } else if (track.metadata?.coverImage && track.coverImage && !bulkCoverFile) {
        const response = await fetch(track.coverImage);
        const blob = await response.blob();
        formData.append('coverImage', blob, 'cover.jpg');
      }

      // Use XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            updateTrack(index, { progress: percentComplete });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            updateTrack(index, { status: 'success', progress: 100 });
            resolve(true);
          } else {
            const errorData = JSON.parse(xhr.responseText);
            updateTrack(index, {
              status: 'error',
              error: errorData.error || 'Upload failed'
            });
            reject(new Error(errorData.error || 'Upload failed'));
          }
        });

        xhr.addEventListener('error', () => {
          updateTrack(index, { status: 'error', error: 'Network error' });
          reject(new Error('Network error'));
        });

        xhr.open('POST', '/api/admin/tracks');
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
        xhr.send(formData);
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      updateTrack(index, { status: 'error', error: error.message || 'Failed to upload track' });
      return false;
    }
  };

  const handleUploadAll = async () => {
    if (tracks.length === 0) return;

    // Validate all tracks
    const invalidTracks = tracks.filter(t => !t.title || !t.artistId);
    if (invalidTracks.length > 0) {
      alert('Please ensure all tracks have a title and artist selected');
      return;
    }

    setUploading(true);

    // Upload tracks sequentially to avoid overwhelming the server
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].status === 'pending') {
        await uploadSingleTrack(tracks[i], i);
      }
    }

    setUploading(false);
  };

  const clearCompleted = () => {
    setTracks(prev => prev.filter(t => t.status !== 'success'));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-[#ff5c2e]';
      case 'error': return 'text-red-400';
      case 'uploading': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'uploading': return '↑';
      default: return '●';
    }
  };

  const pendingCount = tracks.filter(t => t.status === 'pending').length;
  const successCount = tracks.filter(t => t.status === 'success').length;
  const errorCount = tracks.filter(t => t.status === 'error').length;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Upload Tracks</h1>
            <p className="text-gray-400">Upload multiple tracks with bulk editing and automatic metadata extraction</p>
          </div>
          <a
            href="/admin/tracks"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ← Back to Tracks
          </a>
        </div>

        {/* Upload Stats */}
        {tracks.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                <div>
                  <span className="text-gray-400">Total: </span>
                  <span className="text-white font-bold">{tracks.length}</span>
                </div>
                <div>
                  <span className="text-gray-400">Pending: </span>
                  <span className="text-yellow-400 font-bold">{pendingCount}</span>
                </div>
                <div>
                  <span className="text-gray-400">Success: </span>
                  <span className="text-[#ff5c2e] font-bold">{successCount}</span>
                </div>
                {errorCount > 0 && (
                  <div>
                    <span className="text-gray-400">Failed: </span>
                    <span className="text-red-400 font-bold">{errorCount}</span>
                  </div>
                )}
              </div>
              <button
                onClick={clearCompleted}
                disabled={successCount === 0}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear Completed
              </button>
            </div>
          </div>
        )}

        {/* Bulk Settings */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Bulk Settings (Apply to All Tracks)</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Default Artist */}
              <div>
                <label className="block text-gray-300 mb-2 font-medium">Default Artist</label>
                <select
                  value={selectedArtistId}
                  onChange={(e) => setSelectedArtistId(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                >
                  <option value="">No default - use metadata</option>
                  {artists.map((artist) => (
                    <option key={artist.id} value={artist.id}>
                      {artist.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Album Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-300 font-medium">Album</label>
                  <button
                    onClick={() => setShowCreateAlbum(!showCreateAlbum)}
                    className="text-sm text-[#ff5c2e] hover:text-[#ff7043]"
                  >
                    {showCreateAlbum ? '− Cancel' : '+ Create New Album'}
                  </button>
                </div>

                {showCreateAlbum ? (
                  <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                    <input
                      type="text"
                      value={newAlbumTitle}
                      onChange={(e) => setNewAlbumTitle(e.target.value)}
                      placeholder="Album Title"
                      className="w-full px-3 py-2 bg-gray-600 text-white rounded"
                    />
                    <select
                      value={newAlbumArtist}
                      onChange={(e) => setNewAlbumArtist(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-600 text-white rounded"
                    >
                      <option value="">Select Artist</option>
                      {artists.map((artist) => (
                        <option key={artist.id} value={artist.id}>
                          {artist.name}
                        </option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={newAlbumType}
                        onChange={(e) => setNewAlbumType(e.target.value)}
                        className="px-3 py-2 bg-gray-600 text-white rounded"
                      >
                        <option value="album">Album</option>
                        <option value="single">Single</option>
                        <option value="ep">EP</option>
                      </select>
                      <input
                        type="date"
                        value={newAlbumReleaseDate}
                        onChange={(e) => setNewAlbumReleaseDate(e.target.value)}
                        className="px-3 py-2 bg-gray-600 text-white rounded"
                      />
                    </div>
                    <button
                      onClick={handleCreateAlbum}
                      disabled={creatingAlbum || !newAlbumTitle || !newAlbumArtist}
                      className="w-full px-4 py-2 bg-[#ff4a14] text-white rounded hover:bg-[#d43e11] disabled:opacity-50"
                    >
                      {creatingAlbum ? 'Creating...' : 'Create Album'}
                    </button>
                  </div>
                ) : (
                  <select
                    value={bulkAlbumId}
                    onChange={(e) => setBulkAlbumId(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                    disabled={!selectedArtistId}
                  >
                    <option value="">No album - Singles</option>
                    {albums.map((album) => (
                      <option key={album.id} value={album.id}>
                        {album.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-gray-300 mb-2 font-medium">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={bulkTags}
                  onChange={(e) => setBulkTags(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                  placeholder="e.g., summer, upbeat, dance, party"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Genres */}
              <div>
                <label className="block text-gray-300 mb-2 font-medium">Genres</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto bg-gray-700 rounded-lg p-3">
                  {genres.map((genre) => (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => handleBulkGenreToggle(genre.id)}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                        bulkGenres.includes(genre.id)
                          ? 'bg-[#ff4a14] text-white'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cover Art */}
              <div>
                <label className="block text-gray-300 mb-2 font-medium">Cover Art (applies to all tracks)</label>
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
                      {bulkCoverImage ? (
                        <img src={bulkCoverImage} alt="Bulk Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-gray-500 text-4xl">🎵</div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <input
                      ref={bulkCoverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBulkCoverSelect}
                      className="hidden"
                      id="bulk-cover-upload"
                    />
                    <label
                      htmlFor="bulk-cover-upload"
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      {bulkCoverImage ? 'Replace Image' : 'Upload Image'}
                    </label>
                    <p className="text-xs text-gray-400 mt-2">
                      This image will be used for all uploaded tracks
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Apply Button */}
          {tracks.length > 0 && pendingCount > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={applyBulkSettings}
                className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Settings to All {pendingCount} Pending Track{pendingCount > 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>

        {/* File Selection */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Select Audio Files</h2>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="audio-upload"
            />
            <label htmlFor="audio-upload" className="cursor-pointer inline-flex flex-col items-center">
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="text-white text-lg font-semibold mb-2">
                Choose audio files
              </h3>
              <p className="text-gray-400 mb-4">
                MP3, WAV, FLAC, M4A supported • Select multiple files
              </p>
              <span className="px-6 py-3 bg-[#ff4a14] text-white rounded-lg hover:bg-[#d43e11]">
                Select Files
              </span>
            </label>
          </div>
        </div>

        {/* Track List */}
        {tracks.length > 0 && (
          <div className="space-y-4">
            {tracks.map((track, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start gap-4 mb-4">
                  {/* Cover Image */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
                      {track.coverImage ? (
                        <img src={track.coverImage} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-gray-500 text-3xl">🎵</div>
                      )}
                    </div>
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-white truncate">{track.file.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`${getStatusColor(track.status)} font-bold`}>
                          {getStatusIcon(track.status)} {track.status.toUpperCase()}
                        </span>
                        <button
                          onClick={() => removeTrack(index)}
                          disabled={track.status === 'uploading'}
                          className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {track.status === 'uploading' && (
                      <div className="mb-4">
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#ff4a14] h-full transition-all duration-300"
                            style={{ width: `${track.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{track.progress}% uploaded</p>
                      </div>
                    )}

                    {/* Error Message */}
                    {track.error && (
                      <div className="mb-4 p-3 bg-red-900/20 border border-red-600 rounded text-red-400 text-sm">
                        {track.error}
                      </div>
                    )}

                    {/* Editable Fields */}
                    {track.status !== 'success' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Title *</label>
                          <input
                            type="text"
                            value={track.title}
                            onChange={(e) => updateTrack(index, { title: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm"
                            disabled={track.status === 'uploading'}
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Artist *</label>
                          <select
                            value={track.artistId}
                            onChange={(e) => updateTrack(index, { artistId: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm"
                            disabled={track.status === 'uploading'}
                          >
                            <option value="">Select artist...</option>
                            {artists.map((artist) => (
                              <option key={artist.id} value={artist.id}>
                                {artist.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Album</label>
                          <select
                            value={track.albumId}
                            onChange={(e) => updateTrack(index, { albumId: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm"
                            disabled={!track.artistId || track.status === 'uploading'}
                          >
                            <option value="">Single</option>
                            {albums.filter(a => a.artist_id === track.artistId).map((album) => (
                              <option key={album.id} value={album.id}>
                                {album.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {tracks.length > 0 && pendingCount > 0 && (
          <div className="flex gap-4">
            <button
              onClick={handleUploadAll}
              disabled={uploading || pendingCount === 0}
              className="flex-1 px-8 py-4 bg-[#ff4a14] text-white font-bold rounded-lg hover:bg-[#d43e11] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? `Uploading ${pendingCount} track${pendingCount > 1 ? 's' : ''}...` : `Upload ${pendingCount} Track${pendingCount > 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
