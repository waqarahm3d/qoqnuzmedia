/**
 * Test Page for Milestone A
 *
 * This page allows you to test the R2 streaming functionality.
 * Replace the trackId with an actual track ID from your database.
 */

'use client';

import { useState } from 'react';

export default function TestPage() {
  const [trackId, setTrackId] = useState('t3333333-3333-3333-3333-333333333331');
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackInfo, setTrackInfo] = useState<any>(null);

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

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>🎵 Qoqnuz Music - Streaming Test</h1>

      <div style={{ marginBottom: '30px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Milestone A: Test R2 Streaming</h2>
        <p style={{ marginBottom: '10px' }}>
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
          <h3 style={{ fontSize: '20px', marginBottom: '15px' }}>✅ Stream URL Generated!</h3>

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
            }}
          >
            {streamUrl}
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4 style={{ marginBottom: '10px' }}>Audio Player:</h4>
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
        <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Sample Track IDs (from seed data):</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '8px', fontFamily: 'monospace', fontSize: '13px' }}>
            <code>t3333333-3333-3333-3333-333333333331</code> - Maya Rivers - Golden
          </li>
          <li style={{ marginBottom: '8px', fontFamily: 'monospace', fontSize: '13px' }}>
            <code>t1111111-1111-1111-1111-111111111111</code> - Luna Eclipse - Aurora
          </li>
          <li style={{ marginBottom: '8px', fontFamily: 'monospace', fontSize: '13px' }}>
            <code>t2222222-2222-2222-2222-222222222222</code> - The Crimson Waves - Ocean Heart
          </li>
        </ul>
        <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          These IDs will work after you run the seed data SQL script.
        </p>
      </div>
    </div>
  );
}
