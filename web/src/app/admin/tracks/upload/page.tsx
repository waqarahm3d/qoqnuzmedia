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

export default function TrackUploadPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [extractedMetadata, setExtractedMetadata] = useState<TrackMetadata | null>(null);
  const [extracting, setExtracting] = useState(false);

  const [title, setTitle] = useState('');
  const [artistId, setArtistId] = useState('');
  const [albumId, setAlbumId] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [tags, setTags] = useState<string>('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(0);
  const [explicit, setExplicit] = useState(false);
  const [releaseDate, setReleaseDate] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [customCoverFile, setCustomCoverFile] = useState<File | null>(null);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (artistId) {
      fetchAlbumsForArtist(artistId);
    } else {
      setAlbums([]);
    }
  }, [artistId]);

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
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    setExtracting(true);

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

      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const picture = metadata.common.picture[0];
        const blob = new Blob([new Uint8Array(picture.data)], { type: picture.format });
        const imageUrl = URL.createObjectURL(blob);
        extracted.coverImage = imageUrl;
        setCoverImage(imageUrl);
      }

      setExtractedMetadata(extracted);
      setTitle(extracted.title);
      setDuration(Math.round(extracted.duration * 1000));
      // setDescription(metadata.common.comment?.[0] || ''); // Skip comment extraction

      if (extracted.year) {
        setReleaseDate(`${extracted.year}-01-01`);
      }

      if (extracted.artist) {
        const matchedArtist = artists.find(
          a => a.name.toLowerCase() === extracted.artist.toLowerCase()
        );
        if (matchedArtist) {
          setArtistId(matchedArtist.id);
        }
      }

    } catch (error) {
      console.error('Failed to extract metadata:', error);
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    } finally {
      setExtracting(false);
    }
  };

  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomCoverFile(file);
    const imageUrl = URL.createObjectURL(file);
    setCoverImage(imageUrl);
  };

  const handleGenreToggle = (genreId: string) => {
    setSelectedGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!audioFile) {
      setMessage({ type: 'error', text: 'Please select an audio file' });
      return;
    }

    if (!title || !artistId) {
      setMessage({ type: 'error', text: 'Title and artist are required' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('audioFile', audioFile);
      formData.append('title', title);
      formData.append('artistId', artistId);
      if (albumId) formData.append('albumId', albumId);
      formData.append('duration_ms', duration.toString());
      formData.append('explicit', explicit.toString());
      formData.append('description', description);
      formData.append('tags', tags);
      formData.append('releaseDate', releaseDate);
      formData.append('genreIds', JSON.stringify(selectedGenres));

      if (customCoverFile) {
        formData.append('coverImage', customCoverFile);
      } else if (extractedMetadata?.coverImage && coverImage) {
        const response = await fetch(coverImage);
        const blob = await response.blob();
        formData.append('coverImage', blob, 'cover.jpg');
      }

      const response = await fetch('/api/admin/tracks', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      setMessage({ type: 'success', text: `Track "${title}" uploaded successfully!` });

      setTimeout(() => {
        resetForm();
      }, 2000);

    } catch (error: any) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to upload track' });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setAudioFile(null);
    setExtractedMetadata(null);
    setTitle('');
    setArtistId('');
    setAlbumId('');
    setSelectedGenres([]);
    setTags('');
    setDescription('');
    setDuration(0);
    setExplicit(false);
    setReleaseDate('');
    setCoverImage(null);
    setCustomCoverFile(null);
    if (audioInputRef.current) audioInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Upload Track</h1>
            <p className="text-gray-400">Upload a new track with complete metadata</p>
          </div>
          <a
            href="/admin/tracks"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ← Back to Tracks
          </a>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-900/20 border-green-600 text-green-400'
                : 'bg-red-900/20 border-red-600 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Audio File</h2>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
                id="audio-upload"
              />
              <label htmlFor="audio-upload" className="cursor-pointer inline-flex flex-col items-center">
                <div className="text-6xl mb-4">🎵</div>
                <h3 className="text-white text-lg font-semibold mb-2">
                  {audioFile ? audioFile.name : 'Choose audio file'}
                </h3>
                <p className="text-gray-400 mb-4">
                  {extracting ? 'Extracting metadata...' : 'MP3, WAV, FLAC, M4A supported'}
                </p>
                {!audioFile && (
                  <span className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Select File
                  </span>
                )}
              </label>
            </div>
          </div>

          {audioFile && (
            <>
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Track Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-gray-300 mb-2">
                      Track Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                      placeholder="Enter track title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">
                      Artist <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={artistId}
                      onChange={(e) => setArtistId(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                      required
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
                    <label className="block text-gray-300 mb-2">Album (Optional)</label>
                    <select
                      value={albumId}
                      onChange={(e) => setAlbumId(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                      disabled={!artistId}
                    >
                      <option value="">No album / Single</option>
                      {albums.map((album) => (
                        <option key={album.id} value={album.id}>
                          {album.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Duration</label>
                    <input
                      type="text"
                      value={duration ? `${Math.floor(duration / 60000)}:${String(Math.floor((duration % 60000) / 1000)).padStart(2, '0')}` : 'Auto-detected'}
                      className="w-full px-4 py-2 bg-gray-600 text-gray-300 rounded-lg cursor-not-allowed"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-2">Release Date</label>
                    <input
                      type="date"
                      value={releaseDate}
                      onChange={(e) => setReleaseDate(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={explicit}
                        onChange={(e) => setExplicit(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-300">Explicit Content</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Genres & Tags</h2>

                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Select Genres</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {genres.map((genre) => (
                      <button
                        key={genre.id}
                        type="button"
                        onClick={() => handleGenreToggle(genre.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedGenres.includes(genre.id)
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                    placeholder="e.g., summer, upbeat, dance, party"
                  />
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Description</h2>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg resize-none"
                  placeholder="Enter track description..."
                />
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Cover Art</h2>
                <div className="flex gap-6 items-start">
                  <div className="flex-shrink-0">
                    <div className="w-48 h-48 bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
                      {coverImage ? (
                        <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-gray-500 text-5xl">🎵</div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-gray-300 mb-4">
                      {extractedMetadata?.coverImage
                        ? 'Cover art extracted from audio file'
                        : 'No cover art found in audio file'}
                    </p>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageSelect}
                      className="hidden"
                      id="cover-upload"
                    />
                    <label
                      htmlFor="cover-upload"
                      className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      {coverImage ? 'Replace Image' : 'Upload Image'}
                    </label>
                    <p className="text-xs text-gray-400 mt-2">
                      Recommended: 3000x3000px, JPG or PNG
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload Track'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={uploading}
                  className="px-8 py-4 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </AdminLayout>
  );
}
