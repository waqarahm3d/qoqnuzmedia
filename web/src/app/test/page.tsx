/**
 * Test Page for Milestone A & B
 *
 * This page allows you to:
 * 1. Test R2 streaming functionality
 * 2. Upload MP3 files to R2 and create track records
 */

'use client';

import { useState } from 'react';

export default function TestPage() {
  const [trackId, setTrackId] = useState('t3333333-3333-3333-3333-333333333331');
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackInfo, setTrackInfo] = useState<any>(null);

  // Upload state
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [artistName, setArtistName] = useState('');
  const [trackTitle, setTrackTitle] = useState('');

  const testStream = async () => {
    setLoading(true);
    setError(null);
    setStreamUrl(null);

    try {
      const response = await fetch(`/api/stream/${trackId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get stream URL');
      }

      setStreamUrl(data.streamUrl);
      setTrackInfo(data.track);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'audio/mpeg' && file.type !== 'audio/mp3') {
        setUploadError('Please select an MP3 file');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !artistName || !trackTitle) {
      setUploadError('Please fill in all fields and select a file');
      return;
    }

    setUploadLoading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('artist_name', artistName);
      formData.append('track_title', trackTitle);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadSuccess(data);
      setSelectedFile(null);
      setArtistName('');
      setTrackTitle('');
      // Reset file input
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui', background: '#ffffff', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#000' }}>🎵 Qoqnuz Music - Test Dashboard</h1>

      {/* Upload Section */}
      <div style={{ marginBottom: '30px', padding: '20px', background: '#f0f8ff', borderRadius: '8px', border: '2px solid #1DB954' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#000' }}>📤 Upload MP3 File</h2>
        <p style={{ marginBottom: '15px', color: '#333' }}>
          Upload an MP3 file to R2 storage and create a track record in the database:
        </p>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#000', fontWeight: 'bold' }}>
            Artist Name *
          </label>
          <input
            type="text"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="Enter artist name"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#000', fontWeight: 'bold' }}>
            Track Title *
          </label>
          <input
            type="text"
            value={trackTitle}
            onChange={(e) => setTrackTitle(e.target.value)}
            placeholder="Enter track title"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#000', fontWeight: 'bold' }}>
            MP3 File *
          </label>
          <input
            id="fileInput"
            type="file"
            accept="audio/mpeg,audio/mp3"
            onChange={handleFileChange}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
          {selectedFile && (
            <p style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={uploadLoading || !selectedFile || !artistName || !trackTitle}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            background: uploadLoading ? '#ccc' : '#1DB954',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            cursor: uploadLoading || !selectedFile || !artistName || !trackTitle ? 'not-allowed' : 'pointer',
            opacity: uploadLoading || !selectedFile || !artistName || !trackTitle ? 0.6 : 1,
          }}
        >
          {uploadLoading ? 'Uploading...' : 'Upload to R2'}
        </button>

        {uploadError && (
          <div style={{
            marginTop: '15px',
            padding: '15px',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c00',
          }}>
            <strong>Upload Error:</strong> {uploadError}
          </div>
        )}

        {uploadSuccess && (
          <div style={{
            marginTop: '15px',
            padding: '15px',
            background: '#efe',
            border: '1px solid #cfc',
            borderRadius: '8px',
            color: '#000',
          }}>
            <strong>✅ Upload Successful!</strong>
            <div style={{ marginTop: '10px' }}>
              <div><strong>Track ID:</strong> {uploadSuccess.track?.id}</div>
              <div><strong>Title:</strong> {uploadSuccess.track?.title}</div>
              <div><strong>Artist:</strong> {uploadSuccess.track?.artists?.name}</div>
              <div><strong>Audio URL:</strong> <span style={{ fontSize: '11px', wordBreak: 'break-all' }}>{uploadSuccess.track?.audio_url}</span></div>
            </div>
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#060' }}>
              You can now use this Track ID to test streaming below!
            </p>
          </div>
        )}
      </div>

      {/* Streaming Test Section */}
      <div style={{ marginBottom: '30px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#000' }}>🎧 Test R2 Streaming</h2>
        <p style={{ marginBottom: '10px', color: '#333' }}>
          Enter a track ID from your database to test streaming:
        </p>

        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            placeholder="Enter track ID"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'monospace',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          onClick={testStream}
          disabled={loading || !trackId}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            background: '#1DB954',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Loading...' : 'Test Stream'}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '15px',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#c00',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {trackInfo && (
        <div
          style={{
            padding: '15px',
            background: '#efe',
            border: '1px solid #cfc',
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#000',
          }}
        >
          <strong>Track Info:</strong>
          <div style={{ marginTop: '10px' }}>
            <div><strong>Title:</strong> {trackInfo.title}</div>
            <div><strong>Artist:</strong> {trackInfo.artist}</div>
            <div><strong>ID:</strong> {trackInfo.id}</div>
          </div>
        </div>
      )}

      {streamUrl && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '15px', color: '#000' }}>✅ Stream URL Generated!</h3>

          <div
            style={{
              padding: '15px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
              marginBottom: '20px',
              wordBreak: 'break-all',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: '#000',
            }}
          >
            {streamUrl}
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4 style={{ marginBottom: '10px', color: '#000' }}>Audio Player:</h4>
            <audio
              controls
              src={streamUrl}
              style={{ width: '100%', marginBottom: '20px' }}
              autoPlay
            >
              Your browser does not support the audio element.
            </audio>
          </div>

          <div style={{ fontSize: '14px', color: '#666' }}>
            <p><strong>Note:</strong> This URL expires in 1 hour for security.</p>
          </div>
        </div>
      )}

      <div style={{ marginTop: '40px', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#000' }}>Sample Track IDs (from seed data):</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#333' }}>
            <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>t3333333-3333-3333-3333-333333333331</code> - Maya Rivers - Golden
          </li>
          <li style={{ marginBottom: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#333' }}>
            <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>t1111111-1111-1111-1111-111111111111</code> - Luna Eclipse - Aurora
          </li>
          <li style={{ marginBottom: '8px', fontFamily: 'monospace', fontSize: '13px', color: '#333' }}>
            <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>t2222222-2222-2222-2222-222222222222</code> - The Crimson Waves - Ocean Heart
          </li>
        </ul>
        <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          These IDs will work after you run the seed data SQL script.
        </p>
      </div>
    </div>
  );
}
