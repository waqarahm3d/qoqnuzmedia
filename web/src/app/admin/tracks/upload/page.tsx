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

  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedArtistId) {
      fetchAlbumsForArtist(selectedArtistId);
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
          albumId: '',
          selectedGenres: [],
          tags: '',
          description: '',
          duration: Math.round(extracted.duration * 1000),
          explicit: false,
          releaseDate: extracted.year ? `${extracted.year}-01-01` : '',
          coverImage: coverImageUrl,
          customCoverFile: null,
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
          albumId: '',
          selectedGenres: [],
          tags: '',
          description: '',
          duration: 0,
          explicit: false,
          releaseDate: '',
          coverImage: null,
          customCoverFile: null,
          progress: 0,
          status: 'pending',
        });
      }
    }

    setTracks(prev => [...prev, ...newTracks]);
  };

  const updateTrack = (index: number, updates: Partial<TrackUpload>) => {
    setTracks(prev => prev.map((track, i) => i === index ? { ...track, ...updates } : track));
  };

  const removeTrack = (index: number) => {
    setTracks(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenreToggle = (index: number, genreId: string) => {
    setTracks(prev => prev.map((track, i) => {
      if (i !== index) return track;
      const selectedGenres = track.selectedGenres.includes(genreId)
        ? track.selectedGenres.filter(id => id !== genreId)
        : [...track.selectedGenres, genreId];
      return { ...track, selectedGenres };
    }));
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
      } else if (track.metadata?.coverImage && track.coverImage) {
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
      case 'success': return 'text-green-400';
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
            <p className="text-gray-400">Upload multiple tracks with automatic metadata extraction</p>
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
                  <span className="text-green-400 font-bold">{successCount}</span>
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

        {/* File Selection */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Select Audio Files</h2>

          {/* Default Artist Selection */}
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Default Artist (Optional)</label>
            <select
              value={selectedArtistId}
              onChange={(e) => setSelectedArtistId(e.target.value)}
              className="w-full md:w-1/2 px-4 py-2 bg-gray-700 text-white rounded-lg"
            >
              <option value="">No default - use metadata</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              If selected, all tracks without metadata will use this artist
            </p>
          </div>

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
              <span className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
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
                            className="bg-green-600 h-full transition-all duration-300"
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
              className="flex-1 px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? `Uploading ${pendingCount} track${pendingCount > 1 ? 's' : ''}...` : `Upload ${pendingCount} Track${pendingCount > 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
