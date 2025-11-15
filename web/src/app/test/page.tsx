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
      formData.append('artistName', artistName);
      formData.append('title', trackTitle);

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
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        padding: '40px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1
            style={{
              fontSize: '36px',
              fontWeight: '700',
              color: '#ffffff',
              marginBottom: '10px',
              letterSpacing: '-0.5px',
            }}
          >
            🎵 Qoqnuz Music
          </h1>
          <p style={{ fontSize: '16px', color: '#a0a0b0', margin: 0 }}>
            Test Dashboard - Upload & Stream MP3 Files
          </p>
        </div>

        {/* Upload Section */}
        <div
          style={{
            marginBottom: '30px',
            padding: '30px',
            background: '#242442',
            borderRadius: '16px',
            border: '1px solid #3a3a5a',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '24px' }}>📤</span>
              Upload MP3 File
            </h2>
            <p style={{ fontSize: '14px', color: '#9090a0', margin: 0 }}>
              Upload an MP3 file to R2 storage and create a track record in the database
            </p>
          </div>

          {/* Artist Name Input */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#e0e0e0',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Artist Name <span style={{ color: '#ff6b6b' }}>*</span>
            </label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Enter artist name"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                background: '#1a1a2e',
                color: '#ffffff',
                border: '2px solid #3a3a5a',
                borderRadius: '8px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#1DB954')}
              onBlur={(e) => (e.target.style.borderColor = '#3a3a5a')}
            />
          </div>

          {/* Track Title Input */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#e0e0e0',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Track Title <span style={{ color: '#ff6b6b' }}>*</span>
            </label>
            <input
              type="text"
              value={trackTitle}
              onChange={(e) => setTrackTitle(e.target.value)}
              placeholder="Enter track title"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                background: '#1a1a2e',
                color: '#ffffff',
                border: '2px solid #3a3a5a',
                borderRadius: '8px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#1DB954')}
              onBlur={(e) => (e.target.style.borderColor = '#3a3a5a')}
            />
          </div>

          {/* MP3 File Input */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#e0e0e0',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              MP3 File <span style={{ color: '#ff6b6b' }}>*</span>
            </label>
            <input
              id="fileInput"
              type="file"
              accept="audio/mpeg,audio/mp3"
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                background: '#1a1a2e',
                color: '#ffffff',
                border: '2px solid #3a3a5a',
                borderRadius: '8px',
                boxSizing: 'border-box',
                cursor: 'pointer',
              }}
            />
            {selectedFile && (
              <p
                style={{
                  marginTop: '8px',
                  fontSize: '13px',
                  color: '#1DB954',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                ✓ Selected: <strong>{selectedFile.name}</strong> (
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploadLoading || !selectedFile || !artistName || !trackTitle}
            style={{
              width: '100%',
              padding: '14px 24px',
              fontSize: '16px',
              fontWeight: '600',
              background:
                uploadLoading || !selectedFile || !artistName || !trackTitle
                  ? '#4a4a6a'
                  : 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor:
                uploadLoading || !selectedFile || !artistName || !trackTitle
                  ? 'not-allowed'
                  : 'pointer',
              transition: 'all 0.2s',
              boxShadow:
                uploadLoading || !selectedFile || !artistName || !trackTitle
                  ? 'none'
                  : '0 4px 16px rgba(29, 185, 84, 0.3)',
            }}
          >
            {uploadLoading ? '⏳ Uploading...' : '📤 Upload to R2 Storage'}
          </button>

          {/* Upload Error */}
          {uploadError && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                background: 'rgba(255, 59, 48, 0.1)',
                border: '1px solid rgba(255, 59, 48, 0.3)',
                borderRadius: '8px',
                color: '#ff6b6b',
                fontSize: '14px',
              }}
            >
              <strong>⚠️ Upload Error:</strong> {uploadError}
            </div>
          )}

          {/* Upload Success */}
          {uploadSuccess && (
            <div
              style={{
                marginTop: '20px',
                padding: '20px',
                background: 'rgba(29, 185, 84, 0.1)',
                border: '1px solid rgba(29, 185, 84, 0.3)',
                borderRadius: '8px',
                color: '#ffffff',
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: '#1ed760',
                }}
              >
                ✅ Upload Successful!
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                <div style={{ color: '#d0d0d0' }}>
                  <strong style={{ color: '#ffffff' }}>Track ID:</strong>{' '}
                  <code
                    style={{
                      background: '#1a1a2e',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: '#1ed760',
                      fontSize: '13px',
                    }}
                  >
                    {uploadSuccess.track?.id}
                  </code>
                </div>
                <div style={{ color: '#d0d0d0' }}>
                  <strong style={{ color: '#ffffff' }}>Title:</strong>{' '}
                  {uploadSuccess.track?.title}
                </div>
                <div style={{ color: '#d0d0d0' }}>
                  <strong style={{ color: '#ffffff' }}>Artist:</strong>{' '}
                  {uploadSuccess.track?.artist}
                </div>
                <div style={{ color: '#d0d0d0', wordBreak: 'break-all' }}>
                  <strong style={{ color: '#ffffff' }}>Audio URL:</strong>{' '}
                  <span style={{ fontSize: '11px' }}>{uploadSuccess.track?.audio_url}</span>
                </div>
              </div>
              <p
                style={{
                  marginTop: '12px',
                  fontSize: '13px',
                  color: '#1ed760',
                  background: 'rgba(29, 185, 84, 0.1)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  margin: '12px 0 0 0',
                }}
              >
                💡 You can now use this Track ID to test streaming below!
              </p>
            </div>
          )}
        </div>

        {/* Streaming Test Section */}
        <div
          style={{
            marginBottom: '30px',
            padding: '30px',
            background: '#242442',
            borderRadius: '16px',
            border: '1px solid #3a3a5a',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '24px' }}>🎧</span>
              Test R2 Streaming
            </h2>
            <p style={{ fontSize: '14px', color: '#9090a0', margin: 0 }}>
              Enter a track ID from your database to test streaming functionality
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#e0e0e0',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Track ID
            </label>
            <input
              type="text"
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              placeholder="Enter track ID (e.g., t3333333-3333-3333-3333-333333333331)"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                background: '#1a1a2e',
                color: '#ffffff',
                border: '2px solid #3a3a5a',
                borderRadius: '8px',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#1DB954')}
              onBlur={(e) => (e.target.style.borderColor = '#3a3a5a')}
            />
          </div>

          <button
            onClick={testStream}
            disabled={loading || !trackId}
            style={{
              width: '100%',
              padding: '14px 24px',
              fontSize: '16px',
              fontWeight: '600',
              background:
                loading || !trackId
                  ? '#4a4a6a'
                  : 'linear-gradient(135deg, #1DB954 0%, #1ed760 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: loading || !trackId ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow:
                loading || !trackId ? 'none' : '0 4px 16px rgba(29, 185, 84, 0.3)',
            }}
          >
            {loading ? '⏳ Loading...' : '▶️ Test Stream'}
          </button>

          {/* Error Display */}
          {error && (
            <div
              style={{
                marginTop: '20px',
                padding: '16px',
                background: 'rgba(255, 59, 48, 0.1)',
                border: '1px solid rgba(255, 59, 48, 0.3)',
                borderRadius: '8px',
                color: '#ff6b6b',
                fontSize: '14px',
              }}
            >
              <strong>⚠️ Error:</strong> {error}
            </div>
          )}

          {/* Track Info Display */}
          {trackInfo && (
            <div
              style={{
                marginTop: '20px',
                padding: '20px',
                background: 'rgba(29, 185, 84, 0.1)',
                border: '1px solid rgba(29, 185, 84, 0.3)',
                borderRadius: '8px',
                color: '#ffffff',
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: '#1ed760',
                }}
              >
                ℹ️ Track Information
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#d0d0d0' }}>
                <div>
                  <strong style={{ color: '#ffffff' }}>Title:</strong> {trackInfo.title}
                </div>
                <div>
                  <strong style={{ color: '#ffffff' }}>Artist:</strong> {trackInfo.artist}
                </div>
                <div>
                  <strong style={{ color: '#ffffff' }}>ID:</strong>{' '}
                  <code
                    style={{
                      background: '#1a1a2e',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: '#1ed760',
                      fontSize: '13px',
                    }}
                  >
                    {trackInfo.id}
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Audio Player */}
          {streamUrl && (
            <div style={{ marginTop: '20px' }}>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: '#1ed760',
                }}
              >
                ✅ Stream URL Generated!
              </div>

              <div
                style={{
                  padding: '16px',
                  background: '#1a1a2e',
                  border: '1px solid #3a3a5a',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  wordBreak: 'break-all',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#9090a0',
                  lineHeight: '1.6',
                }}
              >
                {streamUrl}
              </div>

              <div
                style={{
                  padding: '20px',
                  background: '#1a1a2e',
                  borderRadius: '8px',
                  border: '1px solid #3a3a5a',
                }}
              >
                <h4
                  style={{
                    marginTop: 0,
                    marginBottom: '12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  🎵 Audio Player
                </h4>
                <audio
                  controls
                  src={streamUrl}
                  style={{
                    width: '100%',
                    outline: 'none',
                    filter: 'brightness(0.9)',
                  }}
                  autoPlay
                >
                  Your browser does not support the audio element.
                </audio>
                <p
                  style={{
                    marginTop: '12px',
                    marginBottom: 0,
                    fontSize: '12px',
                    color: '#9090a0',
                  }}
                >
                  ⏱️ This URL expires in 1 hour for security purposes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sample Track IDs */}
        <div
          style={{
            padding: '24px',
            background: '#242442',
            borderRadius: '16px',
            border: '1px solid #3a3a5a',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#ffffff',
            }}
          >
            📋 Sample Track IDs
          </h3>
          <p style={{ fontSize: '13px', color: '#9090a0', marginBottom: '16px' }}>
            These IDs will work after you run the seed data SQL script
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                padding: '12px',
                background: '#1a1a2e',
                borderRadius: '6px',
                border: '1px solid #3a3a5a',
              }}
            >
              <code
                style={{
                  color: '#1ed760',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                }}
              >
                t3333333-3333-3333-3333-333333333331
              </code>
              <div style={{ color: '#9090a0', fontSize: '13px', marginTop: '4px' }}>
                Maya Rivers - Golden
              </div>
            </div>

            <div
              style={{
                padding: '12px',
                background: '#1a1a2e',
                borderRadius: '6px',
                border: '1px solid #3a3a5a',
              }}
            >
              <code
                style={{
                  color: '#1ed760',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                }}
              >
                t1111111-1111-1111-1111-111111111111
              </code>
              <div style={{ color: '#9090a0', fontSize: '13px', marginTop: '4px' }}>
                Luna Eclipse - Aurora
              </div>
            </div>

            <div
              style={{
                padding: '12px',
                background: '#1a1a2e',
                borderRadius: '6px',
                border: '1px solid #3a3a5a',
              }}
            >
              <code
                style={{
                  color: '#1ed760',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                }}
              >
                t2222222-2222-2222-2222-222222222222
              </code>
              <div style={{ color: '#9090a0', fontSize: '13px', marginTop: '4px' }}>
                The Crimson Waves - Ocean Heart
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '20px' }}>
          <p style={{ fontSize: '13px', color: '#7070a0', margin: 0 }}>
            Qoqnuz Music - Test Dashboard v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
