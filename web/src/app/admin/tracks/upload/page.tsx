'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase-client';

interface Artist {
  id: string;
  name: string;
}

interface UploadFile {
  file: File;
  title: string;
  artistId: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
  trackId?: string;
}

export default function BulkUploadPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [defaultArtistId, setDefaultArtistId] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchArtists();
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const audioFiles = selectedFiles.filter(f => f.type.startsWith('audio/'));

    const newFiles: UploadFile[] = audioFiles.map(file => ({
      file,
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      artistId: defaultArtistId,
      progress: 0,
      status: 'pending',
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const updateFile = (index: number, updates: Partial<UploadFile>) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (index: number) => {
    const uploadFile = files[index];
    updateFile(index, { status: 'uploading', progress: 0 });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const artist = artists.find(a => a.id === uploadFile.artistId);
      if (!artist) throw new Error('Artist not found');

      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('title', uploadFile.title);
      formData.append('artistName', artist.name);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          updateFile(index, { progress });
        }
      });

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.statusText));
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      });

      xhr.open('POST', '/api/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
      xhr.send(formData);

      const result: any = await uploadPromise;
      updateFile(index, {
        status: 'complete',
        progress: 100,
        trackId: result.track?.id,
      });
    } catch (error: any) {
      updateFile(index, {
        status: 'error',
        error: error.message,
      });
    }
  };

  const uploadAll = async () => {
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'pending') {
        await uploadFile(i);
      }
    }

    setUploading(false);
  };

  const allComplete = files.length > 0 && files.every(f => f.status === 'complete');
  const hasErrors = files.some(f => f.status === 'error');

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Upload Audio Files</h1>
            <p className="text-gray-400">Upload single or multiple audio files</p>
          </div>
          <a
            href="/admin/tracks"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ← Back to Tracks
          </a>
        </div>

        {/* Upload Area */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Default Artist</label>
            <select
              value={defaultArtistId}
              onChange={(e) => setDefaultArtistId(e.target.value)}
              className="w-full max-w-md px-4 py-2 bg-gray-700 text-white rounded-lg"
            >
              <option value="">Select default artist...</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Will be applied to all files (can be changed individually)
            </p>
          </div>

          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors">
            <input
              type="file"
              multiple
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex flex-col items-center"
            >
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="text-white text-lg font-semibold mb-2">
                Choose audio files to upload
              </h3>
              <p className="text-gray-400 mb-4">
                Supports MP3, WAV, FLAC, and other audio formats
              </p>
              <span className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Select Files
              </span>
            </label>
          </div>
        </div>

        {/* Files List */}
        {files.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                Files ({files.length})
              </h2>
              <div className="flex gap-2">
                {allComplete && (
                  <a
                    href="/admin/tracks"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View Tracks
                  </a>
                )}
                {!allComplete && (
                  <button
                    onClick={uploadAll}
                    disabled={uploading || files.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload All'}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {files.map((fileItem, index) => (
                <div
                  key={index}
                  className="bg-gray-700 rounded-lg p-4 flex items-start gap-4"
                >
                  {/* File Icon/Status */}
                  <div className="w-12 h-12 bg-gray-600 rounded flex items-center justify-center flex-shrink-0 text-2xl">
                    {fileItem.status === 'complete' && '✓'}
                    {fileItem.status === 'error' && '✗'}
                    {fileItem.status === 'uploading' && '⏳'}
                    {fileItem.status === 'pending' && '🎵'}
                  </div>

                  {/* File Details */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-2">
                      <input
                        type="text"
                        value={fileItem.title}
                        onChange={(e) => updateFile(index, { title: e.target.value })}
                        disabled={fileItem.status !== 'pending'}
                        className="w-full bg-gray-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
                        placeholder="Track title"
                      />
                    </div>

                    <div className="mb-2">
                      <select
                        value={fileItem.artistId}
                        onChange={(e) => updateFile(index, { artistId: e.target.value })}
                        disabled={fileItem.status !== 'pending'}
                        className="w-full bg-gray-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
                      >
                        <option value="">Select artist...</option>
                        {artists.map((artist) => (
                          <option key={artist.id} value={artist.id}>
                            {artist.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{fileItem.file.name}</span>
                      <span>•</span>
                      <span>{(fileItem.file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>

                    {/* Progress Bar */}
                    {fileItem.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-600 transition-all duration-300"
                            style={{ width: `${fileItem.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {Math.round(fileItem.progress)}%
                        </p>
                      </div>
                    )}

                    {/* Error */}
                    {fileItem.error && (
                      <p className="text-xs text-red-400 mt-2">{fileItem.error}</p>
                    )}

                    {/* Success */}
                    {fileItem.status === 'complete' && (
                      <p className="text-xs text-green-400 mt-2">
                        Upload complete! Track ID: {fileItem.trackId}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {fileItem.status === 'pending' && (
                      <>
                        <button
                          onClick={() => uploadFile(index)}
                          disabled={!fileItem.artistId}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 mr-2"
                        >
                          Upload
                        </button>
                        <button
                          onClick={() => removeFile(index)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </>
                    )}
                    {fileItem.status === 'error' && (
                      <button
                        onClick={() => {
                          updateFile(index, { status: 'pending', error: undefined });
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            {allComplete && (
              <div className="mt-6 p-4 bg-green-900/20 border border-green-600 rounded-lg">
                <p className="text-green-400 font-semibold">
                  ✓ All files uploaded successfully!
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  You can now view and manage your tracks in the tracks page.
                </p>
              </div>
            )}

            {hasErrors && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-600 rounded-lg">
                <p className="text-red-400 font-semibold">
                  Some files failed to upload
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Please check the errors and retry.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
